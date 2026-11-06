import Link from "next/link";
import { myChildDash } from "@/lib/me";
import { fmtDate, subjectLabel, daysBetween } from "@/lib/insights";
import { COACHING } from "@/lib/contact";
import { Avatar, CardHead, Insight, bnNum } from "@/components/dash";
import { Icon } from "@/components/Icons";
import { AttendanceCard, CommentsCard, SimpleResultBars, StudentKpis, SubjectCard } from "@/components/StudentViews";

const LAMP = { ok: "#22c55e", warn: "#f59e0b", bad: "#ef4444" };
const lvl = (p: number, good = 75, mid = 50) => (p >= good ? "ok" : p >= mid ? "warn" : "bad") as keyof typeof LAMP;
const WORD = { ok: "ভালো", warn: "নজর দিন", bad: "সাহায্য দরকার" };

export default async function GuardianHome() {
  const { d } = await myChildDash();
  const r = d.row;
  const name = d.student.user.name;
  const first = name.split(" ")[0];
  const att = d.att4 ?? r?.attPct ?? 0;
  const res = r?.avgPct ?? 0;
  const statuses = [
    { label: "ক্লাসে উপস্থিতি", level: lvl(att, 80, 65), value: `${bnNum(att)}%` },
    { label: "পরীক্ষার ফলাফল", level: lvl(res, 70, 50), value: `${bnNum(res)}%` },
    ...(d.weakest ? [{ label: subjectLabel(d.weakest.name), level: lvl(d.weakest.pct, 70, 50), value: `${bnNum(Math.round(d.weakest.pct))}%` }] : []),
  ];
  const worst = statuses.some((s) => s.level === "bad") ? "bad" : statuses.some((s) => s.level === "warn") ? "warn" : "ok";
  const headline = worst === "ok" ? `✅ ${first} ভালো করছে।` : worst === "warn" ? `🟡 ${first} মোটামুটি ভালো, কিছু জায়গায় নজর দিন।` : `⚠️ ${first}-এর দিকে এখনই নজর দেওয়া দরকার।`;

  const absences = [...d.recent].filter((x) => x.status === "ABSENT").sort((a, b) => b.date.localeCompare(a.date));
  const daysToExam = d.nextExam ? daysBetween(d.today, d.nextExam.date) : null;

  return (
    <div className="g12">
      <section className="hero s7">
        <div className="child">
          <Avatar name={name} size={58} />
          <div><div className="hi">আপনার সন্তান</div><h2 style={{ margin: "2px 0 0" }}>{name}</h2><div className="hi">{d.student.rollNo} · {d.student.batch.name}</div></div>
        </div>
        <div className="verdict" style={{ marginBottom: 16 }}>
          <b>{headline}</b>{" "}
          {worst === "ok" ? "নিয়মিত ক্লাসে আসছে এবং পরীক্ষার নম্বর ভালো।" : r?.absentStreak && r.absentStreak >= 3 ? `শেষ ${bnNum(r.absentStreak)} দিন ক্লাসে আসেনি।` : d.weakest ? `${subjectLabel(d.weakest.name)}-এ আরও পড়া দরকার।` : ""}
        </div>
        <div className="status-list">
          {statuses.map((s) => (
            <div key={s.label} className="st"><div className="lamp"><i style={{ background: LAMP[s.level] }} /></div><b>{s.label}</b><span>{WORD[s.level]} · {s.value}</span></div>
          ))}
        </div>
      </section>

      <div className="card s5" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CardHead title="জরুরি তথ্য" sub="যেগুলো আপনার জানা দরকার" />
        {absences.slice(0, 2).map((a) => (
          <Insight key={a.date} tone="bad" icon="alert"><b>{fmtDate(a.date)}</b> {first} ক্লাসে অনুপস্থিত ছিল।</Insight>
        ))}
        {d.nextExam && (
          <Insight tone="acc" icon="calendar"><b>{fmtDate(d.nextExam.date)}</b> {d.nextExam.title}{daysToExam !== null && daysToExam >= 0 ? ` — ${daysToExam === 0 ? "আজ" : `${bnNum(daysToExam)} দিন পর`}` : ""}। সময়মতো পাঠাবেন।</Insight>
        )}
        {d.last && d.last.rank <= 3 && <Insight tone="ok" icon="trophy">{d.last.title}-এ {bnNum(d.last.outOf)} জনের মধ্যে <b>{bnNum(d.last.rank)}য়</b> হয়েছে 🎉</Insight>}
        {!absences.length && !d.nextExam && <Insight tone="ok" icon="check">সব ঠিক আছে — নতুন কোনো সতর্কতা নেই।</Insight>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: "auto", paddingTop: 6 }}>
          <a className="btn btn-p" style={{ justifyContent: "center" }} href={`tel:${COACHING.phone}`}><Icon name="phone" /><span className="bn">কোচিং-এ কল</span></a>
          <a className="btn btn-s" style={{ justifyContent: "center" }} href={`https://wa.me/${COACHING.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" style={{ color: "#16a34a" }} />WhatsApp</a>
        </div>
      </div>

      <StudentKpis d={d} guardian />
      <SimpleResultBars d={d} />
      <SubjectCard d={d} span="s5" simple />
      <CommentsCard d={d} name={first} />
      <AttendanceCard d={d} title="ক্লাসে উপস্থিতি" />
      <div className="s12 muted" style={{ textAlign: "center" }}>
        আরেক সন্তানের তথ্য দেখতে লগআউট করে তার Student ID দিয়ে লগইন করুন · <Link className="link" href="/guardian/contact">PIN বদলান</Link>
      </div>
    </div>
  );
}
