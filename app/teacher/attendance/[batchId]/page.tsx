import { requireRole } from "@/lib/auth";
import { AttendanceSheetPage } from "@/components/features/AttendancePages";

export default async function Page({ params }: { params: Promise<{ batchId: string }> }) {
  const s = await requireRole("TEACHER");
  const { batchId } = await params;
  return <AttendanceSheetPage session={s} batchId={batchId} base="/teacher" />;
}
