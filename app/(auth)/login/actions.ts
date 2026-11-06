"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePhone, normalizeStudentId } from "@/lib/ids";
import { SESSION_COOKIE, signSession, homeFor, type Role, type Session } from "@/lib/session";


export async function login(_: string | null, form: FormData): Promise<string | null> {
  const role = String(form.get("role") || "STUDENT") as Role;
  const id = String(form.get("id") || "").trim();
  const secret = String(form.get("password") || "");
  const remember = form.get("remember") === "on";
  if (!id || !secret) return "ID ar password/PIN duitai dorkar";

  let session: Session | null = null;

  if (role === "STUDENT" || role === "GUARDIAN") {
    const student = await prisma.student.findUnique({ where: { rollNo: normalizeStudentId(id) }, include: { user: true, guardian: true } });
    if (!student || student.status !== "ACTIVE") return "Ei Student ID pawa jai nai";
    if (role === "STUDENT") {
      if (!(await bcrypt.compare(secret, student.user.passwordHash))) return "Password vul";
      session = { userId: student.userId, name: student.user.name, role: "STUDENT" };
    } else {
      if (!student.guardian || !student.guardianPinHash) return "Ei student er jonno guardian account khola hoyni — coaching e jogajog korun";
      if (!(await bcrypt.compare(secret, student.guardianPinHash))) return "Guardian PIN vul";
      session = { userId: student.guardian.id, name: student.guardian.name, role: "GUARDIAN", studentId: student.id };
    }
  } else {
    const key = id.includes("@") ? { email: id.toLowerCase() } : { phone: normalizePhone(id) };
    const user = await prisma.user.findFirst({ where: { ...key, role } });
    if (!user || !(await bcrypt.compare(secret, user.passwordHash))) return role === "ADMIN" ? "Email/mobile ba password vul" : "Mobile ba password vul";
    session = { userId: user.id, name: user.name, role };
  }

  const token = await signSession(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  redirect(homeFor(session.role));
}
