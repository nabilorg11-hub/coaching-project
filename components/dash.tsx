import { avatarTone, initials } from "@/lib/ids";
import { Icon, type IconName } from "./Icons";
import { Sparkline } from "./charts";

export function Kpi({ label, value, unit, icon, tone = "acc", delta, deltaGood = true, foot, spark, sparkColor, dark, valueTone }: {
  label: string; value: string | number; unit?: string; icon: IconName; tone?: "ok" | "warn" | "bad" | "acc";
  delta?: string | null; deltaGood?: boolean; foot?: string; spark?: number[]; sparkColor?: string; dark?: boolean; valueTone?: "bad";
}) {
  return (
    <div className={`card kpi ${dark ? "dark" : ""}`}>
      <div className="top"><span className={`ic t-${tone}`}><Icon name={icon} /></span><span className="bn">{label}</span></div>
      {spark && spark.length > 1 && <div className="spark"><Sparkline values={spark} color={sparkColor ?? "var(--accent)"} /></div>}
      <div className="val num" style={valueTone === "bad" ? { color: "var(--bad-tx)" } : undefined}>{value}{unit && <small>{unit}</small>}</div>
      <div className="foot">
        {delta && <span className={deltaGood ? "up" : "down"}>{delta}</span>}
        {foot && <span className="bn">{foot}</span>}
      </div>
    </div>
  );
}

export function CardHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="card-h">
      <div><h3 className="bn">{title}</h3>{sub && <p className="bn">{sub}</p>}</div>
      {children && <div className="r">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size }: { name: string; size?: number }) {
  return <div className={`av ${avatarTone(name)}`} style={size ? { width: size, height: size, fontSize: size * 0.34 } : undefined}>{initials(name)}</div>;
}

export function Insight({ tone = "acc", icon = "bulb", children }: { tone?: "ok" | "warn" | "bad" | "acc"; icon?: IconName; children: React.ReactNode }) {
  return <div className={`insight t-${tone}`}><Icon name={icon} /><div>{children}</div></div>;
}

export function PctTag({ pct, delta }: { pct: number; delta?: "up" | "down" | "flat" }) {
  const t = pct >= 75 ? "t-ok" : pct >= 50 ? "t-warn" : "t-bad";
  const arrow = delta === "up" ? "▲ " : delta === "down" ? "▼ " : "";
  return <span className={`tag ${t}`}>{arrow}{pct}%</span>;
}

export const fmtDelta = (d: number | null | undefined, unit = "%") =>
  d === null || d === undefined || d === 0 ? null : `${d > 0 ? "▲" : "▼"} ${Math.abs(d)}${unit}`;

/** English digits -> Bangla digits */
export const bnNum = (v: string | number) => String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
