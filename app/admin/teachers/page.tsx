import { prisma } from "@/lib/prisma";
import { subjectLabel } from "@/lib/insights";
import { ActionForm, Field } from "@/components/ActionForm";
import { Avatar, CardHead } from "@/components/dash";
import { addTeacher, resetPassword, setTeacherSubject } from "../actions";

export default async function TeachersPage() {
  const [teachers, subjects] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      include: { subject: true, teaches: { include: { batch: true } }, _count: { select: { attendanceTook: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <div className="head"><div><h1>Teachers ({teachers.length})</h1><p className="bn">প্রতিটি শিক্ষকের বিষয় ঠিক করুন — শিক্ষক শুধু তার বিষয়ের অগ্রগতি দেখবেন</p></div></div>
      <div className="card" style={{ padding: 0, overflowX: "auto", marginBottom: 18 }}>
        <table className="tbl">
          <thead><tr><th style={{ paddingTop: 16 }}>Teacher</th><th>Subject</th><th className="hide-mobile">Batch</th><th className="hide-mobile">Attendance</th><th /></tr></thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td><div className="who"><Avatar name={t.name} /><div><b>{t.name}</b><small>{t.phone}</small></div></div></td>
                <td>
                  <form action={setTeacherSubject} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="hidden" name="teacherId" value={t.id} />
                    <select name="subjectId" defaultValue={t.subjectId ?? ""} className="input" style={{ height: 36, minWidth: 150 }}>
                      <option value="">— সব বিষয় —</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{subjectLabel(s.name)}</option>)}
                    </select>
                    <button className="btn btn-s btn-sm">Save</button>
                  </form>
                </td>
                <td className="hide-mobile"><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{t.teaches.map((x) => <span key={x.batchId} className="tag t-mut">{x.batch.name}</span>)}{!t.teaches.length && "—"}</div></td>
                <td className="hide-mobile num">{t._count.attendanceTook} class</td>
                <td>
                  <form action={resetPassword}>
                    <input type="hidden" name="userId" value={t.id} />
                    <button className="btn btn-s btn-sm">Password reset</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <CardHead title="Notun teacher" sub="Batch assign korte Batch & Course page e jan" />
        <ActionForm action={addTeacher} submit="Add teacher">
          <div className="form-grid">
            <Field label="Name *"><input name="name" required className="input" /></Field>
            <Field label="Mobile *"><input name="phone" required pattern="01\d{9}" className="input" /></Field>
            <Field label="Subject">
              <select name="subjectId" className="input"><option value="">— সব বিষয় —</option>{subjects.map((s) => <option key={s.id} value={s.id}>{subjectLabel(s.name)}</option>)}</select>
            </Field>
          </div>
          <p className="muted">Password = mobile er shesh 6 digit.</p>
        </ActionForm>
      </div>
    </>
  );
}
