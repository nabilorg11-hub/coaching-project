import { requireRole } from "@/lib/auth";
import { AttendanceIndex } from "@/components/features/AttendancePages";

export default async function Page() {
  const s = await requireRole("TEACHER");
  return <AttendanceIndex session={s} base="/teacher" />;
}
