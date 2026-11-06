import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { teacherDashboard, subjectLabel, fmtDate } from "@/lib/insights";
import { Avatar, CardHead, Insight, Kpi, bnNum, fmtDelta } from "@/components/dash";
import { Histogram, LineChart, Sparkline } from "@/components/charts";
import { Icon } from "@/components/Icons";

const STATUS = {
  top: { cls: "t-ok", label: "▲ Top" }, ok: { cls: "t-ok", label: "Bhalo" },
  watch: { cls: "t-warn", label: "Nojor din" }, risk: { cls: "t-bad", label: "⚠ Sahajjo dorkar" },
} as const;

export default async function TeacherHome({ searchParams }: { searchParams: Promise<{ batch?: string; view?: string }> }) {
  const s = await requireRole("TEACHER");
  const { batch: batchParam, view } = await searchParams;
  const d = await teacherDashboard(s.userId, batchParam);
  if (!d || !d.batch) {
    return <div className="card empty"><b>📚</b>Apnake ekhono kono batch e assign kora hoyni. Admin er sathe jogajog korun.</div>;
  }
  const subj = d.subject ? subjectLabel(d.subject.name) : "সব বিষয়";
  const atRisk = d.rows.filter((r) => r.status === "risk");
  const shown = view === "risk" ? atRisk : view === "top" ? [...d.rows].sort((a, b) => b.avg - a.avg).slice(0, 10) : [...d.rows].sort((a, b) => b.avg - a.avg);
  const top3 = [...d.rows].sort((a, b) => b.avg - a.avg).slice(0, 3);
  const help3 = [...d.rows].filter((r) => r.series.length).sort((a, b) => a.avg - b.avg).slice(0, 3);
  const above60 = d.rows.filter((r) => r.series.at(-1) !== undefined && r.series.at(-1)! >= 60).length;
  const pendingTotal = d.pending.reduce((a, p) => a + p.missing, 0);
  const q = (v?: string) => `/teacher?batch=${d.batch!.id}${v ? `&view=${v}` : ""}`;

  return (
    <>
      <div className="head">
        <div><h1>{subj} · {d.batch.name}</h1><p className="bn">আপনার বিষয়ের শিক্ষার্থীদের অবস্থা এক নজরে</p></div>
        {d.batches.length > 1 && (
          <div className="actions" style={{ display: "flex" }}>
            <div className="seg" style={{ alignSelf: "center" }}>
              {d.batches.map((b) => <Link key={b.id} href={`/teacher?batch=${b.id}`} className={b.id === d.batch!.id ? "on" : ""}>{b.name}</Link>)}
            </div>
          </div>
        )}
      </div>

      <div className="g12">
        <section className="hero s12" style={{ padding: "22px 24px" }}>
          <div className="today">
            <div className="big-ic"><Icon name="board" stroke="#fff" /></div>
            <div>
              <div className="hi">আজকের ক্লাস · {d.batch.shift} · {d.batch.course.name}</div>
              <h2 style={{ margin: "4px 0 0", fontSize: 22 }}>{subj} — {bnNum(d.rows.length)} জন শিক্ষার্থী</h2>
            </div>
            <div className="t-btns">
              <Link className="btn btn-w" href={`/teacher/attendance/${d.batch.id}`}><Icon name={d.todayTaken ? "check" : "calendarCheck"} />{d.todayTaken ? "Attendance neya hoyeche" : "Attendance nin"}</Link>
              {d.pending[0] ? (
                <Link className="btn btn-g" href={`/teacher/exams/${d.pending[0].exam.id}`}><Icon name="pen" />{d.pending[0].exam.title} marks</Link>
              ) : (
                <Link className="btn btn-g" href="/teacher/exams"><Icon name="plus" />New exam</Link>
              )}
            </div>
          </div>
        </section>

        <div className="s3"><Kpi label="Students" icon="users" tone="acc" value={d.rows.length} foot={`এই ব্যাচে · মোট ${bnNum(d.allStudents)} জন`} /></div>
        <div className="s3"><Kpi label={`${subj}-এ গড়`} icon="chart" tone="ok" value={d.subjectAvg ?? "—"} unit={d.subjectAvg !== null ? "%" : undefined}
          delta={fmtDelta(d.subjectDelta)} deltaGood={(d.subjectDelta ?? 0) >= 0} foot="গত পরীক্ষার চেয়ে"
          spark={d.examTrend.map((e) => e.value).filter((v): v is number => v !== null)} sparkColor="#e07a12" /></div>
        <div className="s3"><Kpi label="সাহায্য দরকার" icon="alert" tone="bad" value={atRisk.length} valueTone={atRisk.length ? "bad" : undefined}
          foot={`৪৫%-এর নিচে বা ৩+ দিন অনুপস্থিত`} /></div>
        <div className="s3"><Kpi label="নম্বর দেওয়া বাকি" icon="pen" tone="warn" value={d.pending.length} unit=" exam"
          foot={d.pending.length ? `${d.pending[0].exam.title} · ${bnNum(pendingTotal)} জন বাকি` : "সব নম্বর দেওয়া হয়েছে ✓"} /></div>

        <div className="card s8">
          <CardHead title={`Student Progress — ${subj}`} sub={`শেষ ${bnNum(Math.min(5, d.examTrend.length))}টি পরীক্ষা · লাল সারি মানে সাহায্য দরকার`}>
            <div className="seg hide-mobile">
              <Link href={q()} className={!view ? "on" : ""}>All {d.rows.length}</Link>
              <Link href={q("risk")} className={view === "risk" ? "on" : ""}>At-risk {atRisk.length}</Link>
              <Link href={q("top")} className={view === "top" ? "on" : ""}>Top 10</Link>
            </div>
          </CardHead>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th className="hide-mobile">Attend.</th><th>Trend</th><th>Avg</th><th className="hide-mobile">Status</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={r.status === "risk" ? "row-risk" : ""}>
                    <td><Link href={`/teacher/students/${r.id}`} className="who"><Avatar name={r.name} /><div><b>{r.name}</b><small>{r.rollNo}</small></div></Link></td>
                    <td className="hide-mobile num" style={r.attPct < 75 ? { color: "var(--bad-tx)", fontWeight: 700 } : undefined}>{r.attPct}%</td>
                    <td><Sparkline values={r.series.slice(-5)} width={90} height={28} color={r.trend === "up" ? "#10b981" : r.trend === "down" ? "#ef4444" : "#f59e0b"} /></td>
                    <td className="num"><b style={r.avg < 45 ? { color: "var(--bad-tx)" } : undefined}>{r.series.length ? `${r.avg}%` : "—"}</b></td>
                    <td className="hide-mobile">
                      <span className={`tag ${STATUS[r.status].cls}`}>{r.streak >= 3 ? `⚠ ${r.streak} din absent` : STATUS[r.status].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <div className="empty"><b>🎉</b>Ei talikay keu nai</div>}
          </div>
        </div>

        <div className="card s4">
          <CardHead title="নম্বরের বণ্টন" sub={d.latest ? `${d.latest.title} · ${subj}` : "এখনো পরীক্ষা হয়নি"} />
          <Histogram bins={d.bins} />
          <div style={{ marginTop: 14 }}>
            <Insight tone="acc"><b>{bnNum(above60)}</b> জন ৬০%-এর উপরে। <b>{bnNum(atRisk.length)}</b> জনকে আলাদা সাপোর্ট দিন।</Insight>
          </div>
        </div>

        <div className="card s6">
          <CardHead title={`${subj}-এ ক্লাসের গড়`} sub="প্রতিটি পরীক্ষায় পুরো ব্যাচের গড় নম্বর" />
          <LineChart labels={d.examTrend.map((e) => e.label)} series={[{ name: "Class avg", color: "var(--accent)", values: d.examTrend.map((e) => e.value) }]} height={190} />
          {d.nextExam && <p className="muted" style={{ marginTop: 6 }}>পরের পরীক্ষা: <b>{d.nextExam.title}</b> · {fmtDate(d.nextExam.date)}</p>}
        </div>

        <div className="card s6">
          <CardHead title="সেরা ও সাহায্য দরকার" sub="এই সপ্তাহে কাদের দিকে নজর দেবেন" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div className="tag t-ok" style={{ marginBottom: 6 }}>🏆 Top 3</div>
              {top3.map((r) => <Link key={r.id} href={`/teacher/students/${r.id}`} className="mini"><Avatar name={r.name} /><div><b>{r.name.split(" ")[0]}</b><small>{r.avg}%</small></div></Link>)}
            </div>
            <div>
              <div className="tag t-bad" style={{ marginBottom: 6 }}>⚠ Help needed</div>
              {help3.map((r) => <Link key={r.id} href={`/teacher/students/${r.id}`} className="mini"><Avatar name={r.name} /><div><b>{r.name.split(" ")[0]}</b><small>{r.avg}%{r.streak >= 3 ? " · absent" : r.trend === "down" ? " ▼" : ""}</small></div></Link>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
