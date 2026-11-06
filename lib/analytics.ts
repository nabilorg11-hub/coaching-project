import "server-only";
import { prisma } from "./prisma";

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export type ExamResult = { examId: string; title: string; date: string; obtained: number; full: number; pct: number; rank: number; outOf: number };
export type StudentRow = {
  id: string; name: string; rollNo: string; phone: string; batchId: string; batchName: string;
  attPct: number; classes: number; absentStreak: number;
  avgPct: number; lastPct: number | null; trend: "up" | "down" | "flat"; exams: ExamResult[];
  subjects: { name: string; pct: number }[]; weak: string[]; risks: string[];
};

/** Full performance picture for every student in the given batches. */
export async function studentRows(batchIds?: string[]): Promise<StudentRow[]> {
  const where = batchIds ? { batchId: { in: batchIds } } : {};
  const students = await prisma.student.findMany({
    where: { ...where, status: "ACTIVE" },
    include: { user: true, batch: true, attendance: { include: { session: true } } },
    orderBy: { rollNo: "asc" },
  });
  const exams = await prisma.exam.findMany({
    where: batchIds ? { batchId: { in: batchIds } } : {},
    include: { subjects: { include: { subject: true, marks: true } } },
    orderBy: { date: "asc" },
  });

  // per exam totals for every student -> ranks
  const examTotals = new Map<string, Map<string, number>>();
  for (const e of exams) {
    const m = new Map<string, number>();
    for (const es of e.subjects) for (const mk of es.marks) m.set(mk.studentId, (m.get(mk.studentId) ?? 0) + mk.obtained);
    examTotals.set(e.id, m);
  }

  return students.map((st) => {
    const recs = [...st.attendance].sort((a, b) => a.session.date.localeCompare(b.session.date));
    const attended = recs.filter((r) => r.status !== "ABSENT").length;
    let absentStreak = 0;
    for (let i = recs.length - 1; i >= 0 && recs[i].status === "ABSENT"; i--) absentStreak++;

    const results: ExamResult[] = [];
    const subj = new Map<string, { o: number; f: number }>();
    for (const e of exams.filter((x) => x.batchId === st.batchId)) {
      const totals = examTotals.get(e.id)!;
      if (!totals.has(st.id)) continue;
      // only count subjects whose marks are entered, so pending marks don't look like a drop
      const full = e.subjects.filter((s) => s.marks.some((m) => m.studentId === st.id)).reduce((a, s) => a + s.fullMarks, 0);
      const obtained = totals.get(st.id)!;
      const sorted = [...totals.values()].sort((a, b) => b - a);
      results.push({ examId: e.id, title: e.title, date: e.date, obtained, full, pct: pct(obtained, full), rank: sorted.indexOf(obtained) + 1, outOf: sorted.length });
      for (const es of e.subjects) {
        const mk = es.marks.find((m) => m.studentId === st.id);
        if (!mk) continue;
        const cur = subj.get(es.subject.name) ?? { o: 0, f: 0 };
        subj.set(es.subject.name, { o: cur.o + mk.obtained, f: cur.f + es.fullMarks });
      }
    }
    const subjects = [...subj.entries()].map(([name, v]) => ({ name, pct: pct(v.o, v.f) })).sort((a, b) => a.pct - b.pct);
    const avgPct = results.length ? Math.round((results.reduce((a, r) => a + r.pct, 0) / results.length) * 10) / 10 : 0;
    const last3 = results.slice(-3).map((r) => r.pct);
    const trend = last3.length < 2 ? "flat" : last3[last3.length - 1] - last3[0] > 6 ? "up" : last3[0] - last3[last3.length - 1] > 6 ? "down" : "flat";
    const attPct = pct(attended, recs.length);
    const weak = subjects.filter((s) => s.pct < 50).map((s) => s.name);

    const risks: string[] = [];
    if (recs.length && attPct < 75) risks.push(`Attendance ${attPct}%`);
    if (absentStreak >= 3) risks.push(`${absentStreak} din tana absent`);
    if (results.length && avgPct < 50) risks.push(`Avg marks ${avgPct}%`);
    if (trend === "down") risks.push("Result kombe");

    return {
      id: st.id, name: st.user.name, rollNo: st.rollNo, phone: st.user.phone, batchId: st.batchId, batchName: st.batch.name,
      attPct, classes: recs.length, absentStreak, avgPct, lastPct: results.at(-1)?.pct ?? null, trend, exams: results, subjects, weak, risks,
    };
  });
}

export async function studentDetail(studentId: string) {
  const st = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true, batch: { include: { course: true } }, guardian: true } });
  if (!st) return null;
  const row = (await studentRows([st.batchId])).find((r) => r.id === studentId);
  const attendance = await prisma.attendanceRecord.findMany({ where: { studentId }, include: { session: true } });
  const calendar = attendance.map((a) => ({ date: a.session.date, status: a.status })).sort((a, b) => b.date.localeCompare(a.date));
  return { student: st, row, calendar };
}

export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
