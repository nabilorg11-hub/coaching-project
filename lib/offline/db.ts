import Dexie, { type Table } from "dexie";

export type AttendancePayload = { batchId: string; date: string; records: { studentId: string; status: string }[] };
export type MarksPayload = { examId: string; marks: { studentId: string; examSubjectId: string; obtained: number | null }[] };

export type PendingOp =
  | { id: string; kind: "ATTENDANCE"; payload: AttendancePayload; createdAt: number }
  | { id: string; kind: "MARKS"; payload: MarksPayload; createdAt: number };

class OfflineDB extends Dexie {
  pending!: Table<PendingOp, string>;
  constructor() {
    super("coaching-manager");
    this.version(1).stores({ pending: "id, kind, createdAt" });
  }
}

export const db = typeof window !== "undefined" ? new OfflineDB() : (null as unknown as OfflineDB);
