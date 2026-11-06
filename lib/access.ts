import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import type { Session } from "./session";

/** Batches this user may manage: admin = all, teacher = assigned ones. */
export async function manageableBatches(s: Session) {
  return prisma.batch.findMany({
    where: s.role === "ADMIN" ? {} : { teachers: { some: { teacherId: s.userId } } },
    include: { course: true, _count: { select: { students: { where: { status: "ACTIVE" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function assertBatchAccess(s: Session, batchId: string) {
  const ok =
    s.role === "ADMIN" ||
    (s.role === "TEACHER" && (await prisma.batchTeacher.findUnique({ where: { batchId_teacherId: { batchId, teacherId: s.userId } } })));
  if (!ok) notFound();
}

/** Student ids a user may view (for report pages). */
export async function assertStudentAccess(s: Session, studentId: string) {
  const st = await prisma.student.findUnique({ where: { id: studentId } });
  if (!st) notFound();
  if (s.role === "ADMIN") return st;
  if (s.role === "TEACHER") { await assertBatchAccess(s, st.batchId); return st; }
  if (s.role === "GUARDIAN" && st.guardianId === s.userId) return st;
  if (s.role === "STUDENT" && st.userId === s.userId) return st;
  notFound();
}
