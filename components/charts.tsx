// Lightweight SVG/HTML charts (server-rendered, no chart library, work offline).

type Series = { name: string; color: string; values: (number | null)[]; dashed?: boolean; area?: boolean };

const X0 = 4, X1 = 96; // horizontal padding in %
const xAt = (i: number, n: number) => (n <= 1 ? 50 : X0 + ((X1 - X0) * i) / (n - 1));
const yAt = (v: number, max: number) => 100 - (Math.max(0, Math.min(max, v)) / max) * 100;

export function LineChart({ labels, series, height = 220, max = 100, unit = "%", badge }: {
  labels: string[]; series: Series[]; height?: number; max?: number; unit?: string; badge?: string;
}) {
  const n = labels.length;
  if (!n) return <div className="empty"><b>📈</b>Ekhono kono data nai</div>;
  const main = series[0];
  const lastIdx = main.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop() ?? -1;
  return (
    <div>
      <div className="lc" style={{ height }}>
        {[0, 25, 50, 75, 100].map((g) => (
          <div key={g} className="lc-grid" style={{ top: `${yAt((g / 100) * max, max)}%` }}><span>{Math.round((g / 100) * max)}</span></div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {series.map((s, si) => (
              <linearGradient key={si} id={`lg-${si}-${s.color.replace(/[^a-z0-9]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity=".26" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => (v === null ? null : [xAt(i, n), yAt(v, max)] as const)).filter(Boolean) as (readonly [number, number])[];
            if (!pts.length) return null;
            const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
            return (
              <g key={si}>
                {s.area !== false && !s.dashed && <path d={`${d} L${pts[pts.length - 1][0]} 100 L${pts[0][0]} 100 Z`} fill={`url(#lg-${si}-${s.color.replace(/[^a-z0-9]/gi, "")})`} />}
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.dashed ? 2 : 3.2} strokeDasharray={s.dashed ? "6 6" : undefined}
                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        {main.values.map((v, i) => v === null ? null : (
          <span key={i} className={`lc-dot ${i === lastIdx ? "last" : ""}`} style={{ left: `${xAt(i, n)}%`, top: `${yAt(v, max)}%`, borderColor: main.color }} title={`${labels[i]}: ${v}${unit}`} />
        ))}
        {lastIdx >= 0 && (
          <div className="lc-tip" style={{ left: `${xAt(lastIdx, n)}%`, top: `${yAt(main.values[lastIdx]!, max)}%` }}>
            {main.values[lastIdx]}{unit}{badge ? ` ${badge}` : ""}
          </div>
        )}
      </div>
      <div className="lc-x">
        {labels.map((l, i) => <span key={i} style={{ left: `${xAt(i, n)}%` }}>{l}</span>)}
      </div>
      {series.length > 1 && (
        <div className="legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>
      )}
    </div>
  );
}

export function Sparkline({ values, color, width = 84, height = 34 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const d = values.map((v, i) => `${i ? "L" : "M"}${2 + (i * (width - 4)) / (values.length - 1)} ${height - 4 - ((v - min) / span) * (height - 8)}`).join(" ");
  return <svg width={width} height={height}><path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Ring({ pct, size = 150, stroke = 13, label = "overall score", onDark = true, color }: {
  pct: number; size?: number; stroke?: number; label?: string; onDark?: boolean; color?: string;
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const fg = color ?? (onDark ? "#fff" : "var(--accent)");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={onDark ? "rgba(255,255,255,.2)" : "var(--line-2)"} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(Math.max(0, Math.min(100, pct)) / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="48%" textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={onDark ? "#fff" : "var(--text)"} fontFamily="var(--font)">{Math.round(pct)}%</text>
      <text x="50%" y="63%" textAnchor="middle" fontSize={size * 0.08} fill={onDark ? "rgba(255,255,255,.8)" : "var(--faint)"} fontFamily="var(--font)">{label}</text>
    </svg>
  );
}

export function Donut({ parts, total, label = "students", size = 140 }: { parts: { name: string; value: number; color: string }[]; total?: number; label?: string; size?: number }) {
  const sum = total ?? parts.reduce((a, p) => a + p.value, 0);
  const r = size / 2 - 18, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="20" />
      {parts.map((p) => {
        const len = sum ? (p.value / sum) * c : 0;
        const el = <circle key={p.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth="20"
          strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        offset += len;
        return el;
      })}
      <text x="50%" y="49%" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)" fontFamily="var(--font)">{sum.toLocaleString("en-US")}</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="var(--faint)" fontFamily="var(--font)">{label}</text>
    </svg>
  );
}

const tone = (p: number) => (p >= 75 ? "ok" : p >= 50 ? "warn" : "bad");

export function BarsV({ items, height = 200 }: { items: { label: string; pct: number }[]; height?: number }) {
  if (!items.length) return <div className="empty"><b>📊</b>Ekhono kono result nai</div>;
  return (
    <div>
      <div className="bars-v" style={{ height }}>
        {items.map((it, i) => (
          <div key={i} className="bv">
            <span className="pct num">{it.pct}%</span>
            <div className={`col col-${tone(it.pct)} ${i === items.length - 1 ? "last" : ""}`} style={{ height: `${Math.max(4, it.pct) * 0.82}%` }} />
          </div>
        ))}
      </div>
      <div className="bv-l">{items.map((it, i) => <span key={i}>{it.label}</span>)}</div>
    </div>
  );
}

export function Histogram({ bins }: { bins: { label: string; count: number }[] }) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const colors = ["bad", "bad", "warn", "ok", "ok"];
  return (
    <div>
      <div className="hist">
        {bins.map((b, i) => (
          <div key={b.label} className={`col-${colors[i] ?? "ok"}`} style={{ height: `${Math.max(3, (b.count / max) * 100)}%` }}><span>{b.count}</span></div>
        ))}
      </div>
      <div className="hist-l">{bins.map((b) => <span key={b.label}>{b.label}</span>)}</div>
    </div>
  );
}

export function SubjectBars({ subjects }: { subjects: { name: string; pct: number }[] }) {
  if (!subjects.length) return <div className="empty"><b>📚</b>Ekhono data nai</div>;
  return (
    <div>
      {[...subjects].sort((a, b) => b.pct - a.pct).map((s) => (
        <div key={s.name} className="bar-row">
          <span className="bn">{s.name}</span>
          <span className="bar"><span className={`b-${tone(s.pct)}`} style={{ width: `${s.pct}%` }} /></span>
          <b className={`num ${s.pct < 50 ? "down" : ""}`}>{Math.round(s.pct)}%</b>
        </div>
      ))}
    </div>
  );
}

const cellClass: Record<string, string> = { PRESENT: "d-p", LATE: "d-l", ABSENT: "d-a" };

/** Last 4 weeks (Sun..Sat) attendance calendar. */
export function AttendanceHeatmap({ records, today }: { records: { date: string; status: string }[]; today: string }) {
  const map = new Map(records.map((r) => [r.date, r.status]));
  const end = new Date(today + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay() - 21); // Sunday 3 weeks before this week
  const cells: { d: Date; key: string }[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ d, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` });
  }
  return (
    <div>
      <div className="heat">
        {["S", "M", "T", "W", "T", "F", "S"].map((h, i) => <div key={i} className="h">{h}</div>)}
        {cells.map(({ d, key }) => {
          const st = map.get(key);
          const future = key > today;
          const cls = key === today && !st ? "d-t" : st ? cellClass[st] : future ? "d-f" : "d-o";
          return <div key={key} className={`d ${cls}`} title={`${key}${st ? ": " + st : ""}`}>{d.getDate()}</div>;
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: "#10b981" }} />Present</span><span><i style={{ background: "#f59e0b" }} />Late</span>
        <span><i style={{ background: "#ef4444" }} />Absent</span><span><i style={{ background: "var(--line-2)" }} />No class</span>
      </div>
    </div>
  );
}
