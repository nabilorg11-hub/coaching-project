"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/offline/db";
import { enqueue, flush, onSyncChange } from "@/lib/offline/sync";

type Status = "PRESENT" | "ABSENT" | "LATE";
type Props = {
  batchId: string;
  batchName: string;
  students: { id: string; name: string; rollNo: string }[];
  history: Record<string, Record<string, Status>>; // date -> studentId -> status (from server)
  initialDate: string;
};

const btn: Record<Status, string> = {
  PRESENT: "bg-emerald-600 text-white",
  LATE: "bg-amber-500 text-white",
  ABSENT: "bg-red-600 text-white",
};
const label: Record<Status, string> = { PRESENT: "P", LATE: "L", ABSENT: "A" };

export function AttendanceSheet({ batchId, batchName, students, history, initialDate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [local, setLocal] = useState<Record<string, Record<string, Status>>>({}); // unsynced ops
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const lockRef = useRef(false); // keep current marks until refreshed server data arrives
  useEffect(() => { lockRef.current = false; }, [history]);

  // load unsynced (offline) attendance for this batch so it shows on reload
  useEffect(() => {
    const load = async () => {
      const ops = await db.pending.where("kind").equals("ATTENDANCE").sortBy("createdAt");
      const m: Record<string, Record<string, Status>> = {};
      for (const op of ops) {
        if (op.kind !== "ATTENDANCE" || op.payload.batchId !== batchId) continue;
        m[op.payload.date] = Object.fromEntries(op.payload.records.map((r) => [r.studentId, r.status as Status]));
      }
      setLocal(m);
    };
    void load();
    return onSyncChange(() => void load());
  }, [batchId]);

  const saved = useMemo(() => ({ ...history[date], ...local[date] }), [history, local, date]);
  const isPendingSync = !!local[date];
  const alreadyTaken = Object.keys(saved).length > 0;

  useEffect(() => {
    if (lockRef.current) return;
    setMarks(Object.fromEntries(students.map((s) => [s.id, saved[s.id] ?? "PRESENT"])));
    setMsg(null);
  }, [saved, students]);

  const counts = Object.values(marks).reduce((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), {} as Record<string, number>);

  async function save() {
    lockRef.current = true;
    await enqueue({ kind: "ATTENDANCE", payload: { batchId, date, records: students.map((s) => ({ studentId: s.id, status: marks[s.id] })) } });
    const ok = await flush();
    if (ok && navigator.onLine) {
      setMsg("✓ Server e save hoyeche");
      router.refresh();
    } else {
      setMsg("✓ Ei device e save hoyeche — internet ashle automatic sync hobe");
    }
  }

  return (
    <div className="space-y-3">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <div className="h2">{batchName}</div>
          <div className="muted">{students.length} jon student</div>
        </div>
        <label className="text-sm">Date
          <input type="date" value={date} max={initialDate} onChange={(e) => { lockRef.current = false; setDate(e.target.value); }} className="input mt-1" />
        </label>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="tag t-ok">Present {counts.PRESENT ?? 0}</span>
          <span className="tag t-warn">Late {counts.LATE ?? 0}</span>
          <span className="tag t-bad">Absent {counts.ABSENT ?? 0}</span>
        </div>
        <div className="ml-auto text-sm">
          {isPendingSync ? <span className="tag t-warn">⏳ Sync baki</span>
            : alreadyTaken ? <span className="tag t-ok">Age neya hoyeche — edit korte paren</span>
            : <span className="tag t-mut">Ekhono neya hoyni</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, "PRESENT"])))}>Sobai Present</button>
        <button className="btn-ghost" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, "ABSENT"])))}>Sobai Absent</button>
      </div>

      <div className="card divide-y p-0">
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-14 text-sm text-slate-500">{s.rollNo}</span>
            <span className="flex-1 font-medium">{s.name}</span>
            <div className="flex gap-1">
              {(["PRESENT", "LATE", "ABSENT"] as Status[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                  className={`h-9 w-9 rounded-lg text-sm font-bold ${marks[s.id] === st ? btn[st] : "bg-slate-100 text-slate-500"}`}
                  aria-label={`${s.name} ${st}`}
                >
                  {label[st]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky-save">
        <button onClick={save} className="btn-primary">Attendance save</button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}
