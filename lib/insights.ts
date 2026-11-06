import "server-only";
import { prisma } from "./prisma";
import { pct, studentRows, today, type StudentRow } from "./analytics";

const BN_SUBJECT: Record<string, string> = {
  Bangla: "বাংলা", Math: "গণিত", "General Knowledge": "সাধারণ জ্ঞান", "Mental Ability": "মানসিক দক্ষতা",
};
export const subjectLabel = (name: string) => BN_SUBJECT[name] ?? name;

export const shortExam = (title: string) => title.replace("Weekly Test", "Weekly").replace("Model Test", "Model");

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

export function addDays(ymd: string, n: number) {
  const d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
export const fmtDate = (ymd: string) => new Date(ymd + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
export const weekday = (ymd: string) => new Date(ymd + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
export function ago(d: Date) {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Attendance % in a date window for one student's records */
function attWindow(recs: { date: string; status: string }[], from: string, to: string) {
  const r = recs.filter((x) => x.date >= from && x.date <= to);
  return r.length ? pct(r.filter((x) => x.status !== "ABSENT").length, r.length) : null;
}

/* ---------------------------------- Student / Guardian ---------------------------------- */

export async function studentDashboard(studentId: string) {
  const st = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, guardian: true, batch: { include: { course: true, _count: { select: { students: { where: { status: "ACTIVE" } } } } } } },
  });
  if (!st) return null;
  const t = today();
  // independent queries run together (each Supabase round trip is slow)
  const [rows, rawRecords, upcoming, notices, comments] = await Promise.all([
    studentRows([st.batchId]),
    prisma.attendanceRecord.findMany({ where: { studentId }, include: { session: true } }),
    prisma.exam.findMany({ where: { batchId: st.batchId, date: { gte: t } }, include: { subjects: true }, orderBy: { date: "asc" }, take: 4 }),
    prisma.notice.findMany({ where: { OR: [{ batchId: null }, { batchId: st.batchId }] }, include: { author: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.comment.findMany({ where: { studentId }, include: { author: { include: { subject: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const row = rows.find((r) => r.id === studentId) as StudentRow | undefined;
  const records = rawRecords.map((a) => ({ date: a.session.date, status: a.status }));
  const att4 = attWindow(records, addDays(t, -28), t);
  const attPrev = attWindow(records, addDays(t, -56), addDays(t, -29));
  const recent = records.filter((r) => r.date >= addDays(t, -28));

  // batch average per exam
  const batchAvg = new Map<string, number>();
  for (const e of row?.exams ?? []) {
    const vals = rows.map((r) => r.exams.find((x) => x.examId === e.examId)?.pct).filter((v): v is number => v !== undefined);
    batchAvg.set(e.examId, avg(vals));
  }

  const exams = row?.exams ?? [];
  const last = exams.at(-1), prev = exams.at(-2);

  const weakest = row?.subjects[0];
  return {
    student: st, row, records, recent, att4, attDelta: att4 !== null && attPrev !== null ? Math.round((att4 - attPrev) * 10) / 10 : null,
    progress: exams.map((e) => ({ label: shortExam(e.title), me: e.pct, batch: batchAvg.get(e.examId) ?? null })),
    last, rankDelta: last && prev ? prev.rank - last.rank : 0, avgDelta: last && prev ? Math.round((last.pct - prev.pct) * 10) / 10 : null,
    upcoming, nextExam: upcoming[0] ?? null, notices, comments,
    weakest: weakest && weakest.pct < 70 ? weakest : null, batchSize: st.batch._count.students, today: t,
  };
}
export type StudentDash = NonNullable<Awaited<ReturnType<typeof studentDashboard>>>;

/** One-line plain-language verdict used in hero cards */
export function verdict(d: StudentDash) {
  const r = d.row;
  if (!r) return { level: "ok" as const, text: "এখনো যথেষ্ট তথ্য নেই।" };
  const bad = r.risks.length >= 2 || r.avgPct < 45 || (r.classes > 0 && r.attPct < 65);
  const watch = !bad && (r.risks.length > 0 || r.avgPct < 60 || !!d.weakest);
  return { level: bad ? ("bad" as const) : watch ? ("warn" as const) : ("ok" as const) };
}

/* ---------------------------------- Teacher ---------------------------------- */

export async function teacherDashboard(teacherId: string, batchId?: string) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, include: { subject: true, teaches: { include: { batch: { include: { course: true } } } } } });
  if (!teacher) return null;
  const batches = teacher.teaches.map((t) => t.batch).sort((a, b) => a.name.localeCompare(b.name));
  const batch = batches.find((b) => b.id === batchId) ?? batches[0];
  const subject = teacher.subject;
  if (!batch) return { teacher, batches, batch: null, subject };

  const t = today();
  const [students, exams, todaySession, nextExam, allStudents] = await Promise.all([
    prisma.student.findMany({
      where: { batchId: batch.id, status: "ACTIVE" }, include: { user: true, attendance: { include: { session: true } } }, orderBy: { rollNo: "asc" },
    }),
    prisma.exam.findMany({
      where: { batchId: batch.id, date: { lte: t } },
      include: { subjects: { where: subject ? { subjectId: subject.id } : undefined, include: { marks: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.attendanceSession.findUnique({ where: { batchId_date: { batchId: batch.id, date: t } } }),
    prisma.exam.findFirst({ where: { batchId: batch.id, date: { gt: t } }, orderBy: { date: "asc" } }),
    prisma.student.count({ where: { status: "ACTIVE", batchId: { in: batches.map((b) => b.id) } } }),
  ]);
  const subjExams = exams.filter((e) => e.subjects.length);

  const rows = students.map((s) => {
    const series = subjExams.map((e) => {
      const es = e.subjects[0];
      const m = es.marks.find((x) => x.studentId === s.id);
      return m ? pct(m.obtained, es.fullMarks) : null;
    });
    const got = series.filter((v): v is number => v !== null);
    const recs = s.attendance.map((a) => ({ date: a.session.date, status: a.status })).sort((a, b) => a.date.localeCompare(b.date));
    let streak = 0;
    for (let i = recs.length - 1; i >= 0 && recs[i].status === "ABSENT"; i--) streak++;
    const last3 = got.slice(-3);
    const trend = last3.length < 2 ? "flat" : last3.at(-1)! - last3[0] > 4 ? "up" : last3[0] - last3.at(-1)! > 4 ? "down" : "flat";
    const attPct = recs.length ? pct(recs.filter((r) => r.status !== "ABSENT").length, recs.length) : 0;
    const a = avg(got);
    const status: "top" | "ok" | "watch" | "risk" = a < 45 || streak >= 3 ? "risk" : a < 60 || trend === "down" ? "watch" : a >= 80 ? "top" : "ok";
    return { id: s.id, name: s.user.name, rollNo: s.rollNo, series: got, avg: a, trend, attPct, streak, status };
  });

  const latest = subjExams.at(-1);
  const prevExam = subjExams.at(-2);
  const examAvg = (e?: (typeof subjExams)[number]) => {
    if (!e) return null;
    const es = e.subjects[0];
    return es.marks.length ? avg(es.marks.map((m) => pct(m.obtained, es.fullMarks))) : null;
  };
  const latestPcts = latest ? latest.subjects[0].marks.map((m) => pct(m.obtained, latest.subjects[0].fullMarks)) : [];
  const bins = ["0-20", "20-40", "40-60", "60-80", "80-100"].map((label, i) => ({
    label, count: latestPcts.filter((p) => (i === 4 ? p >= 80 : p >= i * 20 && p < (i + 1) * 20)).length,
  }));

  // marks still missing in this teacher's subject
  const pending = subjExams
    .map((e) => ({ exam: e, missing: students.length - e.subjects[0].marks.length }))
    .filter((x) => x.missing > 0);

  return {
    teacher, batches, batch, subject, rows, latest, bins, pending, todayTaken: !!todaySession, nextExam,
    subjectAvg: examAvg(latest), subjectDelta: examAvg(latest) !== null && examAvg(prevExam) !== null ? Math.round((examAvg(latest)! - examAvg(prevExam)!) * 10) / 10 : null,
    examTrend: subjExams.map((e) => ({ label: shortExam(e.title), value: examAvg(e) })),
    allStudents,
  };
}

/* ---------------------------------- Admin ---------------------------------- */

export async function adminDashboard() {
  const t = today();
  const monthStart = addDays(t, -30);
  // all independent reads in one go (each Supabase round trip is slow)
  const [rows, batches, newThisMonth, todaySessions, allSessions, allExams, teachers, exams, recentAdmissions] = await Promise.all([
    studentRows(),
    prisma.batch.findMany({ include: { course: true, teachers: { include: { teacher: true } } }, orderBy: { name: "asc" } }),
    prisma.student.count({ where: { admissionDate: { gte: new Date(monthStart) } } }),
    prisma.attendanceSession.findMany({ where: { date: t }, include: { records: true } }),
    prisma.attendanceSession.findMany({ where: { date: { gte: addDays(t, -56) } }, include: { records: true } }),
    prisma.exam.findMany({ where: { date: { gte: addDays(t, -56), lte: t } }, include: { subjects: { include: { marks: true } } } }),
    prisma.user.findMany({ where: { role: "TEACHER" }, include: { subject: true, teaches: true }, orderBy: { name: "asc" } }),
    prisma.exam.findMany({ where: { date: { lte: t } }, include: { subjects: { include: { _count: { select: { marks: true } } } } } }),
    prisma.student.findMany({ include: { user: true, batch: true }, orderBy: { admissionDate: "desc" }, take: 5 }),
  ]);

  const todayRecs = todaySessions.flatMap((s) => s.records);
  const todayPct = todayRecs.length ? pct(todayRecs.filter((r) => r.status !== "ABSENT").length, todayRecs.length) : null;

  // 8 weekly buckets: attendance % and average result %
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = addDays(t, -56 + i * 7), to = addDays(t, -50 + i * 7);
    const recs = allSessions.filter((s) => s.date >= from && s.date <= to).flatMap((s) => s.records);
    const marks = allExams.filter((e) => e.date >= from && e.date <= to).flatMap((e) => e.subjects.flatMap((es) => es.marks.map((m) => pct(m.obtained, es.fullMarks))));
    return { label: `W${i + 1}`, att: recs.length ? pct(recs.filter((r) => r.status !== "ABSENT").length, recs.length) : null, res: marks.length ? avg(marks) : null };
  });

  const avgResult = avg(rows.filter((r) => r.exams.length).map((r) => r.avgPct));
  const prevAvg = avg(rows.filter((r) => r.exams.length > 1).map((r) => avg(r.exams.slice(0, -1).map((e) => e.pct))));
  const atRisk = rows.filter((r) => r.risks.length).sort((a, b) => b.risks.length - a.risks.length || a.avgPct - b.avgPct);

  const courseCounts = new Map<string, number>();
  for (const b of batches) courseCounts.set(b.course.name, (courseCounts.get(b.course.name) ?? 0) + rows.filter((r) => r.batchId === b.id).length);

  const batchPerf = batches.map((b) => {
    const br = rows.filter((r) => r.batchId === b.id);
    return {
      id: b.id, name: b.name, teachers: b.teachers.map((x) => x.teacher.name), students: br.length,
      att: avg(br.filter((r) => r.classes).map((r) => r.attPct)), res: avg(br.filter((r) => r.exams.length).map((r) => r.avgPct)),
      risk: br.filter((r) => r.risks.length).length, taken: todaySessions.some((s) => s.batchId === b.id),
    };
  });

  const teacherStatus = teachers.map((tch) => {
    const ids = tch.teaches.map((x) => x.batchId);
    const takenToday = todaySessions.filter((s) => s.takenById === tch.id).length;
    let marksMissing = 0;
    for (const e of exams.filter((x) => ids.includes(x.batchId))) {
      const es = e.subjects.find((x) => x.subjectId === tch.subjectId);
      if (es) marksMissing += Math.max(0, rows.filter((r) => r.batchId === e.batchId).length - es._count.marks);
    }
    return { id: tch.id, name: tch.name, subject: tch.subject ? subjectLabel(tch.subject.name) : "—", batches: ids.length, takenToday, marksMissing };
  });


  return {
    rows, total: rows.length, newThisMonth, todayPct, todayCount: todayRecs.length, todayPresent: todayRecs.filter((r) => r.status !== "ABSENT").length,
    batchesTaken: batchPerf.filter((b) => b.taken).length, batchCount: batches.length,
    avgResult, resultDelta: Math.round((avgResult - prevAvg) * 10) / 10, atRisk, weeks,
    courses: [...courseCounts.entries()].map(([name, value]) => ({ name, value })), batchPerf, teacherStatus, recentAdmissions,
  };
}
