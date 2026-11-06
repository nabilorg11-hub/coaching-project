"use client";
import { db, type PendingOp, type AttendancePayload, type MarksPayload } from "./db";

const listeners = new Set<() => void>();
export const onSyncChange = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const notify = () => listeners.forEach((f) => f());

type NewOp = { kind: "ATTENDANCE"; payload: AttendancePayload } | { kind: "MARKS"; payload: MarksPayload };

/** Save an operation locally first (works offline), then try to push it. */
export async function enqueue(op: NewOp) {
  const full = { ...op, id: crypto.randomUUID(), createdAt: Date.now() } as PendingOp;
  await db.pending.add(full);
  notify();
  void flush();
  return full.id;
}

export const pendingCount = () => db.pending.count();
export const pendingOps = () => db.pending.orderBy("createdAt").toArray();

let inflight: Promise<boolean> | null = null;
/** Push queued ops to the server. Concurrent callers share one run. Resolves true when the queue is empty. */
export function flush(): Promise<boolean> {
  if (!navigator.onLine) return Promise.resolve(false);
  inflight ??= doFlush().finally(() => { inflight = null; });
  return inflight;
}

async function doFlush(): Promise<boolean> {
  try {
    const ops = await db.pending.orderBy("createdAt").toArray();
    if (!ops.length) return true;
    const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) });
    if (!res.ok) return false;
    const { done } = (await res.json()) as { done: string[] };
    await db.pending.bulkDelete(done);
    return (await db.pending.count()) === 0;
  } catch {
    return false;
  } finally {
    notify();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { notify(); void flush(); });
  window.addEventListener("offline", notify);
  setInterval(() => void flush(), 30_000);
}
