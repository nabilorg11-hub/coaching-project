import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/access";
import { studentDashboard } from "@/lib/insights";
import { StudentProfileView } from "@/components/StudentProfileView";

export default async function TeacherStudent({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireRole("TEACHER");
  const { id } = await params;
  await assertStudentAccess(s, id);
  const d = await studentDashboard(id);
  if (!d) notFound();
  return (
    <>
      <Link href="/teacher/students" className="back">← Amar students</Link>
      <StudentProfileView d={d} />
    </>
  );
}
