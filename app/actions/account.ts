"use server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type FormState = { ok?: string; error?: string } | null;

/** Change own password (or, for a guardian, the PIN of the child they logged in with) */
export async function changeSecret(_: FormState, f: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) return { error: "Login korun" };
  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  const again = String(f.get("again") ?? "");
  if (next !== again) return { error: "Notun password/PIN duibar ek hoyni" };

  if (s.role === "GUARDIAN") {
    if (!/^\d{6}$/.test(next)) return { error: "PIN 6 ta sonkhar hote hobe" };
    const st = s.studentId ? await prisma.student.findFirst({ where: { id: s.studentId, guardianId: s.userId } }) : null;
    if (!st?.guardianPinHash || !(await bcrypt.compare(current, st.guardianPinHash))) return { error: "Bortoman PIN vul" };
    await prisma.student.update({ where: { id: st.id }, data: { guardianPinHash: await bcrypt.hash(next, 10) } });
    return { ok: "PIN bodle geche" };
  }

  if (next.length < 6) return { error: "Password kompokkhe 6 okkhor hote hobe" };
  const u = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) return { error: "Bortoman password vul" };
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  await prisma.auditLog.create({ data: { userId: u.id, action: "CHANGE_PASSWORD", detail: u.phone } });
  return { ok: "Password bodle geche" };
}
