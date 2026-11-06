import { prisma } from "@/lib/prisma";
import { ActionForm, Field } from "@/components/ActionForm";
import { addBatch, addCourse, addSubject, setBatchTeachers } from "../actions";

export default async function BatchesPage() {
  const [batches, courses, subjects, teachers] = await Promise.all([
    prisma.batch.findMany({
      include: { course: true, teachers: true, _count: { select: { students: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({ include: { _count: { select: { batches: true } } }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="head"><div><h1>Batch & Course</h1><p className="bn">ব্যাচ, কোর্স আর বিষয় — প্রতিটি ব্যাচে কোন শিক্ষক পড়াবেন ঠিক করুন</p></div></div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>Batch</th><th>Course</th><th>Shift</th><th>Start</th><th>Student</th><th>Teacher (save korte Update chapun)</th></tr></thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="font-medium whitespace-nowrap">{b.name}</td>
                <td>{b.course.name}</td>
                <td>{b.shift}</td>
                <td className="whitespace-nowrap">{b.startDate.toISOString().slice(0, 10)}</td>
                <td>{b._count.students}</td>
                <td>
                  <form action={setBatchTeachers} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="batchId" value={b.id} />
                    {teachers.map((t) => (
                      <label key={t.id} className="flex items-center gap-1 whitespace-nowrap">
                        <input type="checkbox" name="teacherIds" value={t.id} defaultChecked={b.teachers.some((x) => x.teacherId === t.id)} /> {t.name}
                      </label>
                    ))}
                    <button className="btn btn-s btn-sm">Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h2 className="h2 mb-3">Notun batch</h2>
          <ActionForm action={addBatch} submit="Batch toiri">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Batch name *"><input name="name" required placeholder="BCS-48 Evening" className="input" /></Field>
              <Field label="Course *">
                <select name="courseId" required className="input">
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Shift">
                <select name="shift" className="input"><option>Morning</option><option>Day</option><option>Evening</option><option>Friday</option></select>
              </Field>
              <Field label="Start date"><input type="date" name="startDate" className="input" /></Field>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium">Teacher:</span>
              {teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-1"><input type="checkbox" name="teacherIds" value={t.id} /> {t.name}</label>
              ))}
            </div>
          </ActionForm>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="h2 mb-2">Course</h2>
            <ul className="mb-3 flex flex-wrap gap-1">
              {courses.map((c) => <li key={c.id} className="tag t-mut">{c.name} ({c._count.batches})</li>)}
            </ul>
            <ActionForm action={addCourse} submit="Add" className="space-y-2"><input name="name" placeholder="e.g. NTRCA" className="input" /></ActionForm>
          </div>
          <div className="card">
            <h2 className="h2 mb-2">Subject</h2>
            <ul className="mb-3 flex flex-wrap gap-1">
              {subjects.map((s) => <li key={s.id} className="tag t-mut">{s.name}</li>)}
            </ul>
            <ActionForm action={addSubject} submit="Add" className="space-y-2"><input name="name" placeholder="e.g. Science" className="input" /></ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
