"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { assertBatchAccess } from "@/lib/access";

type FormState = { ok?: string; error?: string } | null;

export async function createExam(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("ADMIN", "TEACHER");
  const batchId = String(f.get("batchId") ?? "");
  const title = String(f.get("title") ?? "").trim();
  const date = String(f.get("date") ?? "");
  const type = ["MODEL_TEST", "WEEKLY", "MCQ"].includes(String(f.get("type"))) ? String(f.get("type")) : "WEEKLY";
  const subjectIds = f.getAll("subjectIds").map(String);
  if (!batchId || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Batch, title ar date dorkar" };
  if (!subjectIds.length) return { error: "Kompokkhe ekta subject select korun" };
  await assertBatchAccess(s, batchId);

  const subjects = subjectIds.map((subjectId) => ({ subjectId, fullMarks: Math.max(1, Number(f.get(`full_${subjectId}`)) || 25) }));
  const exam = await prisma.exam.create({ data: { batchId, title, date, type, subjects: { create: subjects } } });
  await prisma.auditLog.create({ data: { userId: s.userId, action: "CREATE_EXAM", detail: title } });
  const base = s.role === "ADMIN" ? "/admin" : "/teacher";
  revalidatePath(base, "layout");
  redirect(`${base}/exams/${exam.id}`);
}

export async function deleteExam(f: FormData) {
  const s = await requireRole("ADMIN", "TEACHER");
  const exam = await prisma.exam.findUnique({ where: { id: String(f.get("examId")) } });
  if (!exam) return;
  await assertBatchAccess(s, exam.batchId);
  await prisma.exam.delete({ where: { id: exam.id } });
  await prisma.auditLog.create({ data: { userId: s.userId, action: "DELETE_EXAM", detail: exam.title } });
  const base = s.role === "ADMIN" ? "/admin" : "/teacher";
  revalidatePath(base, "layout");
  redirect(`${base}/exams`);
}
