import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pct, today } from "@/lib/analytics";
import { assertBatchAccess, manageableBatches } from "@/lib/access";
import type { Session } from "@/lib/session";
import { ActionForm, Field } from "../ActionForm";
import { pctTone } from "../ui";
import { createExam, deleteExam } from "@/app/actions/exams";
import { MarksGrid } from "./MarksGrid";

const typeLabel: Record<string, string> = { MODEL_TEST: "Model test", WEEKLY: "Weekly", MCQ: "MCQ" };

export async function ExamsIndex({ session, base }: { session: Session; base: string }) {
  const batches = await manageableBatches(session);
  const [exams, subjects] = await Promise.all([
    prisma.exam.findMany({
      where: { batchId: { in: batches.map((b) => b.id) } },
      include: { batch: true, subjects: { include: { _count: { select: { marks: true } } } } },
      orderBy: { date: "desc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="h1">Exams & Result</h1>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>Date</th><th>Exam</th><th>Batch</th><th>Type</th><th>Subject</th><th>Marks entry</th></tr></thead>
          <tbody>
            {exams.map((e) => {
              const students = batches.find((b) => b.id === e.batchId)?._count.students ?? 0;
              const entered = e.subjects.reduce((a, s) => a + s._count.marks, 0);
              const expected = students * e.subjects.length;
              return (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{e.date}</td>
                  <td><Link href={`${base}/exams/${e.id}`} className="link">{e.title}</Link></td>
                  <td className="whitespace-nowrap">{e.batch.name}</td>
                  <td>{typeLabel[e.type] ?? e.type}</td>
                  <td>{e.subjects.length}</td>
                  <td>{entered >= expected && expected ? <span className="tag t-ok">✓ Complete</span> : <span className="tag t-warn">{entered}/{expected}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!exams.length && <p className="muted p-4">Ekhono kono exam nai.</p>}
      </div>

      <div className="card">
        <h2 className="h2 mb-3">Notun exam</h2>
        <ActionForm action={createExam} submit="Exam toiri kore marks dao" resetOnOk={false}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Batch *">
              <select name="batchId" required className="input">{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </Field>
            <Field label="Title *"><input name="title" required placeholder="Weekly Test 6" className="input" /></Field>
            <Field label="Date *"><input type="date" name="date" defaultValue={today()} required className="input" /></Field>
            <Field label="Type">
              <select name="type" className="input"><option value="WEEKLY">Weekly</option><option value="MODEL_TEST">Model test</option><option value="MCQ">MCQ</option></select>
            </Field>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Subject ar full marks</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border px-2 py-1">
                  <label className="flex flex-1 items-center gap-2 text-sm"><input type="checkbox" name="subjectIds" value={s.id} /> {s.name}</label>
                  <input name={`full_${s.id}`} defaultValue={25} inputMode="numeric" className="input w-16 px-2 py-1" aria-label={`${s.name} full marks`} />
                </div>
              ))}
            </div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}

export async function ExamDetail({ session, examId, base }: { session: Session; examId: string; base: string }) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      batch: { include: { students: { where: { status: "ACTIVE" }, include: { user: true }, orderBy: { rollNo: "asc" } } } },
      subjects: { include: { subject: true, marks: true } },
    },
  });
  if (!exam) notFound();
  await assertBatchAccess(session, exam.batchId);

  const students = exam.batch.students;
  // a teacher enters marks only for their own subject (admin: all subjects)
  const mySubjectId = session.role === "TEACHER" ? (await prisma.user.findUnique({ where: { id: session.userId } }))?.subjectId : null;
  const editable = mySubjectId ? exam.subjects.filter((s) => s.subjectId === mySubjectId) : exam.subjects;
  const fullTotal = exam.subjects.reduce((a, s) => a + s.fullMarks, 0);
  const marks: Record<string, number> = {};
  for (const es of exam.subjects) for (const m of es.marks) marks[`${m.studentId}:${es.id}`] = m.obtained;

  const merit = students
    .map((st) => {
      const got = exam.subjects.map((es) => es.marks.find((m) => m.studentId === st.id)?.obtained);
      const total = got.reduce<number>((a, b) => a + (b ?? 0), 0);
      return { st, total, entered: got.some((g) => g !== undefined) };
    })
    .filter((x) => x.entered)
    .sort((a, b) => b.total - a.total);

  const subjectAvg = exam.subjects.map((es) => ({
    name: es.subject.name,
    avg: es.marks.length ? pct(es.marks.reduce((a, m) => a + m.obtained, 0), es.marks.length * es.fullMarks) : 0,
  }));

  return (
    <div className="space-y-4">
      <Link href={`${base}/exams`} className="back">← Sob exam</Link>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="h1">{exam.title}</h1>
          <p className="muted">{exam.batch.name} · {exam.date} · {typeLabel[exam.type]} · Full marks {fullTotal}</p>
        </div>
        <form action={deleteExam}>
          <input type="hidden" name="examId" value={exam.id} />
          <button className="btn btn-s btn-sm" style={{ color: "var(--bad-tx)" }}>Exam delete</button>
        </form>
      </div>

      <h2 className="h2">Marks entry{mySubjectId ? ` — ${editable[0]?.subject.name ?? "apnar subject ei exam e nai"}` : ""} <span className="muted">(internet chara o kaj kore)</span></h2>
      {editable.length ? <MarksGrid
        examId={exam.id}
        subjects={editable.map((s) => ({ id: s.id, name: s.subject.name, fullMarks: s.fullMarks }))}
        students={students.map((s) => ({ id: s.id, name: s.user.name, rollNo: s.rollNo }))}
        marks={marks}
      /> : <div className="card empty"><b>📝</b>Ei exam e apnar subject nai</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card overflow-x-auto p-0 md:col-span-2">
          <div className="px-4 pt-3"><h2 className="h2">Merit list</h2></div>
          <table className="table">
            <thead><tr><th>Position</th><th>Roll</th><th>Name</th><th>Total</th><th>%</th></tr></thead>
            <tbody>
              {merit.map((m, i) => {
                const p = pct(m.total, fullTotal);
                const pos = merit.findIndex((x) => x.total === m.total) + 1;
                return (
                  <tr key={m.st.id}>
                    <td className="font-semibold">{pos}{i < 3 && pos <= 3 ? " 🏅" : ""}</td>
                    <td className="text-slate-500">{m.st.rollNo}</td>
                    <td><Link href={`${base}/students/${m.st.id}`} className="link">{m.st.user.name}</Link></td>
                    <td>{m.total}/{fullTotal}</td>
                    <td className={pctTone(p)}>{p}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!merit.length && <p className="muted p-4">Marks dile merit list dekhabe.</p>}
        </div>
        <div className="card">
          <h2 className="h2 mb-2">Subject average</h2>
          <ul className="space-y-2">
            {subjectAvg.map((s) => (
              <li key={s.name}>
                <div className="flex justify-between text-sm"><span>{s.name}</span><span className={pctTone(s.avg)}>{s.avg}%</span></div>
                <div className="bar"><span className={s.avg < 50 ? "b-bad" : s.avg < 70 ? "b-warn" : "b-ok"} style={{ width: `${s.avg}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
