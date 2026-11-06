"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/access";

type FormState = { ok?: string; error?: string } | null;

export async function addComment(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("TEACHER", "ADMIN");
  const studentId = String(f.get("studentId") ?? "");
  const text = String(f.get("text") ?? "").trim();
  if (text.length < 3) return { error: "Montobbo likhun" };
  await assertStudentAccess(s, studentId);
  await prisma.comment.create({ data: { studentId, authorId: s.userId, text: text.slice(0, 1000) } });
  revalidatePath("/", "layout");
  return { ok: "Montobbo save hoyeche — student ar guardian dekhte parbe" };
}

export async function deleteComment(f: FormData) {
  const s = await requireRole("TEACHER", "ADMIN");
  const c = await prisma.comment.findUnique({ where: { id: String(f.get("id")) } });
  if (!c || (s.role !== "ADMIN" && c.authorId !== s.userId)) return;
  await prisma.comment.delete({ where: { id: c.id } });
  revalidatePath("/", "layout");
}
