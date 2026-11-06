"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/offline/db";
import { enqueue, flush, onSyncChange } from "@/lib/offline/sync";

type Props = {
  examId: string;
  subjects: { id: string; name: string; fullMarks: number }[]; // id = examSubjectId
  students: { id: string; name: string; rollNo: string }[];
  marks: Record<string, number>; // `${studentId}:${examSubjectId}` -> obtained
};

const key = (s: string, es: string) => `${s}:${es}`;

export function MarksGrid({ examId, subjects, students, marks }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirtyState] = useState(false);
  const dirtyRef = useRef(false);
  const setDirty = (d: boolean) => { dirtyRef.current = d; setDirtyState(d); };
  const lockRef = useRef(false); // keep typed values until the refreshed server data arrives
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // server marks + any unsynced local edits
  useEffect(() => {
    lockRef.current = false;
    const load = async () => {
      const v: Record<string, string> = Object.fromEntries(Object.entries(marks).map(([k, n]) => [k, String(n)]));
      const ops = await db.pending.where("kind").equals("MARKS").sortBy("createdAt");
      let has = false;
      for (const op of ops) {
        if (op.kind !== "MARKS" || op.payload.examId !== examId) continue;
        has = true;
        for (const m of op.payload.marks) v[key(m.studentId, m.examSubjectId)] = m.obtained === null ? "" : String(m.obtained);
      }
      setPending(has);
      if (!dirtyRef.current && !lockRef.current) setValues(v);
    };
    void load();
    return onSyncChange(() => void load());
  }, [examId, marks]);

  const total = (sid: string) => subjects.reduce((a, s) => a + (Number(values[key(sid, s.id)]) || 0), 0);
  const fullTotal = subjects.reduce((a, s) => a + s.fullMarks, 0);

  async function save() {
    const list = students.flatMap((st) =>
      subjects.map((sub) => {
        const raw = values[key(st.id, sub.id)];
        return { studentId: st.id, examSubjectId: sub.id, obtained: raw === undefined || raw === "" ? null : Number(raw) };
      }),
    );
    const bad = list.find((m) => m.obtained !== null && (Number.isNaN(m.obtained) || m.obtained > subjects.find((s) => s.id === m.examSubjectId)!.fullMarks));
    if (bad) { setMsg("⚠ Kono ekta number full marks er beshi ba vul"); return; }
    lockRef.current = true;
    await enqueue({ kind: "MARKS", payload: { examId, marks: list } });
    setDirty(false);
    const ok = await flush();
    if (ok && navigator.onLine) { setMsg("✓ Server e save hoyeche"); router.refresh(); }
    else setMsg("✓ Ei device e save hoyeche — internet ashle sync hobe");
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Roll</th><th>Name</th>
              {subjects.map((s) => <th key={s.id}>{s.name}<div className="text-xs font-normal text-slate-400">/{s.fullMarks}</div></th>)}
              <th>Total<div className="text-xs font-normal text-slate-400">/{fullTotal}</div></th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id}>
                <td className="text-slate-500">{st.rollNo}</td>
                <td className="whitespace-nowrap font-medium">{st.name}</td>
                {subjects.map((sub) => (
                  <td key={sub.id}>
                    <input
                      inputMode="decimal"
                      className="input" style={{ width: 90, height: 38 }}
                      value={values[key(st.id, sub.id)] ?? ""}
                      onChange={(e) => { setDirty(true); setMsg(null); setValues((v) => ({ ...v, [key(st.id, sub.id)]: e.target.value })); }}
                    />
                  </td>
                ))}
                <td className="font-semibold">{total(st.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sticky-save">
        <button onClick={save} className="btn-primary">Marks save</button>
        {dirty && <span className="text-sm text-amber-700">Unsaved change ache</span>}
        {pending && !dirty && <span className="tag t-warn">⏳ Sync baki</span>}
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}
