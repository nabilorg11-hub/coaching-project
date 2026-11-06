import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/analytics";
import { assertBatchAccess, manageableBatches } from "@/lib/access";
import type { Session } from "@/lib/session";
import { AttendanceSheet } from "./AttendanceSheet";

export async function AttendanceIndex({ session, base }: { session: Session; base: string }) {
  const batches = await manageableBatches(session);
  const taken = await prisma.attendanceSession.findMany({ where: { date: today(), batchId: { in: batches.map((b) => b.id) } }, select: { batchId: true } });
  const done = new Set(taken.map((t) => t.batchId));
  return (
    <div className="space-y-4">
      <h1 className="h1">Attendance — {today()}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map((b) => (
          <Link key={b.id} href={`${base}/attendance/${b.id}`} className="card block hover:border-indigo-400">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="muted">{b.course.name} · {b.shift} · {b._count.students} student</div>
              </div>
              {done.has(b.id) ? <span className="tag t-ok">✓ Aaj neya hoyeche</span> : <span className="tag t-warn">Baki</span>}
            </div>
          </Link>
        ))}
        {!batches.length && <p className="muted">Apnar kono batch assign kora nai.</p>}
      </div>
    </div>
  );
}

export async function AttendanceSheetPage({ session, batchId, base }: { session: Session; batchId: string; base: string }) {
  await assertBatchAccess(session, batchId);
  const batch = await prisma.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: { students: { where: { status: "ACTIVE" }, include: { user: true }, orderBy: { rollNo: "asc" } } },
  });
  const sessions = await prisma.attendanceSession.findMany({
    where: { batchId }, include: { records: true }, orderBy: { date: "desc" }, take: 60,
  });
  const history = Object.fromEntries(
    sessions.map((s) => [s.date, Object.fromEntries(s.records.map((r) => [r.studentId, r.status as "PRESENT" | "ABSENT" | "LATE"]))]),
  );
  return (
    <div className="space-y-3">
      <Link href={`${base}/attendance`} className="back">← Sob batch</Link>
      <AttendanceSheet
        batchId={batch.id}
        batchName={batch.name}
        students={batch.students.map((s) => ({ id: s.id, name: s.user.name, rollNo: s.rollNo }))}
        history={history}
        initialDate={today()}
      />
    </div>
  );
}
