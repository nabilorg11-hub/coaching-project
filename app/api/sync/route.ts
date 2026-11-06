import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { PendingOp } from "@/lib/offline/db";

async function canEditBatch(userId: string, role: string, batchId: string) {
  if (role === "ADMIN") return true;
  if (role !== "TEACHER") return false;
  return !!(await prisma.batchTeacher.findUnique({ where: { batchId_teacherId: { batchId, teacherId: userId } } }));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { ops } = (await req.json()) as { ops: PendingOp[] };
  const done: string[] = [];

  for (const op of ops ?? []) {
    // idempotent: an op that was already applied is just acknowledged
    if (await prisma.syncOp.findUnique({ where: { clientOpId: op.id } })) { done.push(op.id); continue; }

    if (op.kind === "ATTENDANCE") {
      const { batchId, date, records } = op.payload;
      if (!(await canEditBatch(s.userId, s.role, batchId))) { done.push(op.id); continue; }
      const valid = new Set((await prisma.student.findMany({ where: { batchId }, select: { id: true } })).map((x) => x.id));
      await prisma.$transaction(async (tx) => {
        const session = await tx.attendanceSession.upsert({
          where: { batchId_date: { batchId, date } },
          create: { batchId, date, takenById: s.userId },
          update: { takenById: s.userId },
        });
        for (const r of records.filter((r) => valid.has(r.studentId) && ["PRESENT", "ABSENT", "LATE"].includes(r.status))) {
          await tx.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: session.id, studentId: r.studentId } },
            create: { sessionId: session.id, studentId: r.studentId, status: r.status },
            update: { status: r.status },
          });
        }
        await tx.syncOp.create({ data: { clientOpId: op.id, userId: s.userId, kind: op.kind } });
        await tx.auditLog.create({ data: { userId: s.userId, action: "ATTENDANCE", detail: `${batchId} ${date} (${records.length})` } });
      });
      done.push(op.id);
    } else if (op.kind === "MARKS") {
      const exam = await prisma.exam.findUnique({ where: { id: op.payload.examId }, include: { subjects: true, batch: { include: { students: { select: { id: true } } } } } });
      if (!exam || !(await canEditBatch(s.userId, s.role, exam.batchId))) { done.push(op.id); continue; }
      // teachers may only write marks for their own subject
      const mySubject = s.role === "TEACHER" ? (await prisma.user.findUnique({ where: { id: s.userId } }))?.subjectId : null;
      const full = new Map(exam.subjects.filter((x) => !mySubject || x.subjectId === mySubject).map((x) => [x.id, x.fullMarks]));
      const studs = new Set(exam.batch.students.map((x) => x.id));
      await prisma.$transaction(async (tx) => {
        for (const m of op.payload.marks) {
          if (!full.has(m.examSubjectId) || !studs.has(m.studentId)) continue;
          const key = { studentId_examSubjectId: { studentId: m.studentId, examSubjectId: m.examSubjectId } };
          if (m.obtained === null || Number.isNaN(m.obtained)) { await tx.mark.deleteMany({ where: key.studentId_examSubjectId }); continue; }
          const v = Math.max(-full.get(m.examSubjectId)!, Math.min(full.get(m.examSubjectId)!, m.obtained));
          await tx.mark.upsert({ where: key, create: { ...key.studentId_examSubjectId, obtained: v }, update: { obtained: v } });
        }
        await tx.syncOp.create({ data: { clientOpId: op.id, userId: s.userId, kind: op.kind } });
        await tx.auditLog.create({ data: { userId: s.userId, action: "MARKS", detail: `${exam.title} (${op.payload.marks.length})` } });
      });
      done.push(op.id);
    } else {
      done.push((op as PendingOp).id);
    }
  }
  return NextResponse.json({ done });
}
