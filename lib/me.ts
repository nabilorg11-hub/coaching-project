import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "./auth";
import { prisma } from "./prisma";
import { studentDashboard } from "./insights";

/** Dashboard data for the logged-in student */
export async function myStudentDash() {
  const s = await requireRole("STUDENT");
  const st = await prisma.student.findUnique({ where: { userId: s.userId } });
  if (!st) notFound();
  const d = await studentDashboard(st.id);
  if (!d) notFound();
  return d;
}

/** Dashboard data for the child the guardian logged in with (falls back to their first child) */
export async function myChildDash() {
  const s = await requireRole("GUARDIAN");
  const children = await prisma.student.findMany({ where: { guardianId: s.userId }, include: { user: true }, orderBy: { rollNo: "asc" } });
  const child = children.find((c) => c.id === s.studentId) ?? children[0];
  if (!child) notFound();
  const d = await studentDashboard(child.id);
  if (!d) notFound();
  return { d, session: s, children };
}
