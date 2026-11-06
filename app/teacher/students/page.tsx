import { requireRole } from "@/lib/auth";
import { manageableBatches } from "@/lib/access";
import { studentRows } from "@/lib/analytics";
import { StudentTable } from "@/components/ui";

export default async function TeacherStudents() {
  const s = await requireRole("TEACHER");
  const batches = await manageableBatches(s);
  const rows = await studentRows(batches.map((b) => b.id));
  return (
    <>
      <div className="head"><div><h1>Amar students ({rows.length})</h1><p className="bn">নাম চাপলে পুরো রিপোর্ট দেখা যাবে, সেখানে মন্তব্যও লিখতে পারবেন</p></div></div>
      <div className="stack">
        {batches.map((b) => (
          <section key={b.id}>
            <h2 className="h2" style={{ margin: "0 0 10px" }}>{b.name} <span className="muted">· {b.course.name}</span></h2>
            <StudentTable rows={rows.filter((r) => r.batchId === b.id)} linkBase="/teacher/students" showBatch={false} />
          </section>
        ))}
      </div>
    </>
  );
}
