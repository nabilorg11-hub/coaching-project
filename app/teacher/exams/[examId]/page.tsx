import { requireRole } from "@/lib/auth";
import { ExamDetail } from "@/components/features/ExamPages";

export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const s = await requireRole("TEACHER");
  const { examId } = await params;
  return <ExamDetail session={s} examId={examId} base="/teacher" />;
}
