import Link from "next/link";
import type { StudentRow } from "@/lib/analytics";
import { Avatar } from "./dash";

export const pctTone = (p: number) => (p < 50 ? "text-red-600" : p < 75 ? "text-amber-600" : "text-emerald-600");

export function TrendIcon({ t }: { t: StudentRow["trend"] }) {
  if (t === "up") return <span className="up">▲</span>;
  if (t === "down") return <span className="down">▼</span>;
  return <span style={{ color: "var(--faint)" }}>–</span>;
}

const tagFor = (p: number) => (p >= 75 ? "t-ok" : p >= 50 ? "t-warn" : "t-bad");

export function StudentTable({ rows, linkBase, showBatch = true }: { rows: StudentRow[]; linkBase?: string; showBatch?: boolean }) {
  if (!rows.length) return <div className="card empty"><b>🧑‍🎓</b>Kono student nai</div>;
  return (
    <div className="card" style={{ padding: 0, overflowX: "auto" }}>
      <table className="tbl">
        <thead>
          <tr><th style={{ paddingTop: 16 }}>Student</th>{showBatch && <th className="hide-mobile">Batch</th>}<th>Attendance</th><th>Avg</th><th className="hide-mobile">Trend</th><th className="hide-mobile">Alert</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.risks.length ? "row-risk" : ""}>
              <td>
                {linkBase ? (
                  <Link className="who" href={`${linkBase}/${r.id}`}><Avatar name={r.name} /><div><b>{r.name}</b><small>{r.rollNo}</small></div></Link>
                ) : (
                  <div className="who"><Avatar name={r.name} /><div><b>{r.name}</b><small>{r.rollNo}</small></div></div>
                )}
              </td>
              {showBatch && <td className="hide-mobile" style={{ whiteSpace: "nowrap" }}>{r.batchName}</td>}
              <td>{r.classes ? <span className={`tag ${tagFor(r.attPct)}`}>{r.attPct}%</span> : "—"}</td>
              <td>{r.exams.length ? <span className={`tag ${tagFor(r.avgPct)}`}>{r.avgPct}%</span> : "—"}</td>
              <td className="hide-mobile"><TrendIcon t={r.trend} /></td>
              <td className="hide-mobile">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{r.risks.map((x) => <span key={x} className="tag t-bad">{x}</span>)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
