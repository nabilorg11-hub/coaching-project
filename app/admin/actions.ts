"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { newPin } from "@/lib/ids";

export type FormState = { ok?: string; error?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const defaultPassword = (phone: string) => phone.slice(-6);
const validPhone = (p: string) => /^01\d{9}$/.test(p);

async function audit(userId: string, action: string, detail: string) {
  await prisma.auditLog.create({ data: { userId, action, detail } });
}

/** Next Student ID like SC-2026-1031 */
async function nextStudentId() {
  const year = new Date().getFullYear();
  const all = await prisma.student.findMany({ select: { rollNo: true } });
  const max = all.reduce((m, s) => Math.max(m, parseInt(s.rollNo.split("-").pop() ?? "0", 10) || 0), 1000);
  return `SC-${year}-${max + 1}`;
}

/** Find guardian by phone or create one. Returns null if no guardian phone given. */
async function upsertGuardian(name: string, phone: string) {
  if (!phone) return null;
  if (!validPhone(phone)) throw new Error(`Guardian phone thik nai: ${phone}`);
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.role !== "GUARDIAN") throw new Error(`${phone} already ${existing.role} hishebe ache`);
    return existing;
  }
  return prisma.user.create({
    data: { name: name || "Guardian", phone, role: "GUARDIAN", passwordHash: await bcrypt.hash(defaultPassword(phone), 10) },
  });
}

async function createStudent(input: { name: string; phone: string; batchId: string; address?: string; guardianName?: string; guardianPhone?: string; relation?: string }) {
  if (!input.name) throw new Error("Name dorkar");
  if (!validPhone(input.phone)) throw new Error(`Phone thik nai: ${input.phone} (01XXXXXXXXX)`);
  if (await prisma.user.findUnique({ where: { phone: input.phone } })) throw new Error(`${input.phone} already registered`);
  const batch = await prisma.batch.findUnique({ where: { id: input.batchId }, include: { course: true } });
  if (!batch) throw new Error("Batch pawa jai nai");
  const guardian = await upsertGuardian(input.guardianName ?? "", input.guardianPhone ?? "");
  const pin = guardian ? newPin() : null;
  const code = await nextStudentId();
  const user = await prisma.user.create({
    data: {
      name: input.name, phone: input.phone, role: "STUDENT",
      passwordHash: await bcrypt.hash(defaultPassword(input.phone), 10),
      student: {
        create: {
          rollNo: code, batchId: batch.id, address: input.address || null, targetExam: batch.course.name,
          guardianId: guardian?.id ?? null, guardianRelation: input.relation || null,
          guardianPinHash: pin ? await bcrypt.hash(pin, 10) : null,
        },
      },
    },
  });
  return { user, code, pin };
}

export async function addStudent(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  try {
    const { user, code, pin } = await createStudent({
      name: str(f, "name"), phone: str(f, "phone"), batchId: str(f, "batchId"), address: str(f, "address"),
      guardianName: str(f, "guardianName"), guardianPhone: str(f, "guardianPhone"), relation: str(f, "relation"),
    });
    await audit(s.userId, "ADD_STUDENT", `${user.name} ${code}`);
    revalidatePath("/admin", "layout");
    return {
      ok: `${user.name} admission hoyeche.\nStudent ID: ${code} · Password: mobile er shesh 6 digit` +
        (pin ? `\nGuardian PIN: ${pin}  (ekhon e likhe guardian ke din — pore ar dekha jabe na)` : ""),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** CSV columns: name,phone,batch,guardian_name,guardian_phone,address */
export async function importStudents(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  const file = f.get("file");
  let text = str(f, "csv");
  if (!text && file instanceof File && file.size) text = await file.text();
  if (!text) return { error: "CSV file ba text dao" };

  const batches = await prisma.batch.findMany();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines[0]?.toLowerCase().startsWith("name")) lines.shift();
  const added: string[] = [];
  const errors: string[] = [];
  for (const [i, line] of lines.entries()) {
    const [name, phone, batchName, guardianName, guardianPhone, address] = line.split(",").map((x) => x?.trim() ?? "");
    const batch = batches.find((b) => b.name.toLowerCase() === batchName?.toLowerCase());
    try {
      if (!batch) throw new Error(`batch "${batchName}" nai`);
      const r = await createStudent({ name, phone, batchId: batch.id, guardianName, guardianPhone, address });
      added.push(`${r.code} ${name}${r.pin ? ` · PIN ${r.pin}` : ""}`);
    } catch (e) {
      errors.push(`Line ${i + 1}: ${(e as Error).message}`);
    }
  }
  await audit(s.userId, "IMPORT_STUDENTS", `${added.length} added`);
  revalidatePath("/admin", "layout");
  const ok = added.length ? `${added.length} jon add hoyeche (Guardian PIN gulo likhe rakhun):\n${added.join("\n")}` : undefined;
  return errors.length ? { ok, error: errors.join("\n") } : { ok: ok ?? "Kichu add hoyni" };
}

export async function setStudentStatus(f: FormData) {
  const s = await requireRole("ADMIN");
  const id = str(f, "id");
  const status = str(f, "status") === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.student.update({ where: { id }, data: { status } });
  await audit(s.userId, "STUDENT_STATUS", `${id} -> ${status}`);
  revalidatePath("/admin", "layout");
}

export async function moveStudent(f: FormData) {
  const s = await requireRole("ADMIN");
  await prisma.student.update({ where: { id: str(f, "id") }, data: { batchId: str(f, "batchId") } });
  await audit(s.userId, "STUDENT_MOVE", `${str(f, "id")} -> ${str(f, "batchId")}`);
  revalidatePath("/admin", "layout");
}

/** New guardian PIN — shown once to the admin */
export async function resetGuardianPin(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  const st = await prisma.student.findUnique({ where: { id: str(f, "id") } });
  if (!st) return { error: "Student pawa jai nai" };
  if (!st.guardianId) return { error: "Ei student er guardian add kora nai" };
  const pin = newPin();
  await prisma.student.update({ where: { id: st.id }, data: { guardianPinHash: await bcrypt.hash(pin, 10) } });
  await audit(s.userId, "RESET_GUARDIAN_PIN", st.rollNo);
  return { ok: `Notun Guardian PIN: ${pin}\nGuardian ke Student ID ${st.rollNo} ar ei PIN din.` };
}

export async function addCourse(_: FormState, f: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const name = str(f, "name");
  if (!name) return { error: "Name dorkar" };
  if (await prisma.course.findUnique({ where: { name } })) return { error: "Ei course already ache" };
  await prisma.course.create({ data: { name } });
  revalidatePath("/admin", "layout");
  return { ok: `Course "${name}" add hoyeche` };
}

export async function addSubject(_: FormState, f: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const name = str(f, "name");
  if (!name) return { error: "Name dorkar" };
  if (await prisma.subject.findUnique({ where: { name } })) return { error: "Ei subject already ache" };
  await prisma.subject.create({ data: { name } });
  revalidatePath("/admin", "layout");
  return { ok: `Subject "${name}" add hoyeche` };
}

export async function addBatch(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  const name = str(f, "name");
  const courseId = str(f, "courseId");
  const teacherIds = f.getAll("teacherIds").map(String).filter(Boolean);
  if (!name || !courseId) return { error: "Name ar course dorkar" };
  await prisma.batch.create({
    data: {
      name, courseId, shift: str(f, "shift") || "Morning",
      startDate: new Date(str(f, "startDate") || Date.now()),
      teachers: { create: teacherIds.map((teacherId) => ({ teacherId })) },
    },
  });
  await audit(s.userId, "ADD_BATCH", name);
  revalidatePath("/admin", "layout");
  return { ok: `Batch "${name}" toiri hoyeche` };
}

export async function setBatchTeachers(f: FormData) {
  await requireRole("ADMIN");
  const batchId = str(f, "batchId");
  const teacherIds = f.getAll("teacherIds").map(String).filter(Boolean);
  await prisma.$transaction([
    prisma.batchTeacher.deleteMany({ where: { batchId } }),
    prisma.batchTeacher.createMany({ data: teacherIds.map((teacherId) => ({ batchId, teacherId })) }),
  ]);
  revalidatePath("/admin", "layout");
}

export async function addTeacher(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  const name = str(f, "name");
  const phone = str(f, "phone");
  const subjectId = str(f, "subjectId") || null;
  if (!name || !validPhone(phone)) return { error: "Name ar thik phone number dorkar (01XXXXXXXXX)" };
  if (await prisma.user.findUnique({ where: { phone } })) return { error: "Ei phone already registered" };
  await prisma.user.create({ data: { name, phone, role: "TEACHER", subjectId, passwordHash: await bcrypt.hash(defaultPassword(phone), 10) } });
  await audit(s.userId, "ADD_TEACHER", name);
  revalidatePath("/admin", "layout");
  return { ok: `${name} add hoyeche. Login: ${phone} · Password: mobile er shesh 6 digit` };
}

export async function setTeacherSubject(f: FormData) {
  await requireRole("ADMIN");
  await prisma.user.update({ where: { id: str(f, "teacherId") }, data: { subjectId: str(f, "subjectId") || null } });
  revalidatePath("/admin", "layout");
}

export async function resetPassword(f: FormData) {
  const s = await requireRole("ADMIN");
  const u = await prisma.user.findUnique({ where: { id: str(f, "userId") } });
  if (!u) return;
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(defaultPassword(u.phone), 10) } });
  await audit(s.userId, "RESET_PASSWORD", u.phone);
}

export async function addNotice(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN");
  const title = str(f, "title");
  const body = str(f, "body");
  if (!title || !body) return { error: "Title ar lekha duitai dorkar" };
  await prisma.notice.create({ data: { title, body, icon: str(f, "icon") || "📢", batchId: str(f, "batchId") || null, authorId: s.userId } });
  revalidatePath("/", "layout");
  return { ok: "Notice prokash hoyeche — student ar guardian dekhte parbe" };
}

export async function deleteNotice(f: FormData) {
  await requireRole("ADMIN");
  await prisma.notice.delete({ where: { id: str(f, "id") } });
  revalidatePath("/", "layout");
}
