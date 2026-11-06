import { requireRole } from "@/lib/auth";
import { ExamsIndex } from "@/components/features/ExamPages";

export default async function Page() {
  const s = await requireRole("ADMIN");
  return <ExamsIndex session={s} base="/admin" />;
}
