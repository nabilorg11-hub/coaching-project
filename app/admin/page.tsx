import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { adminDashboard, fmtDate } from "@/lib/insights";
import { Avatar, CardHead, Insight, Kpi, bnNum, fmtDelta } from "@/components/dash";
import { Donut, LineChart } from "@/components/charts";
import { Icon } from "@/components/Icons";

const COURSE_COLORS = ["#4f46e5", "#14b8a6", "#f59e0b", "#ec4899", "#0ea5e9"];
const tagFor = (p: number) => (p >= 75 ? "t-ok" : p >= 55 ? "t-warn" : "t-bad");
const barFor = (p: number) => (p >= 80 ? "b-ok" : p >= 65 ? "b-warn" : "b-bad");

export default async function AdminHome() {
  const s = await requireRole("ADMIN");
  const d = await adminDashboard();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const topCourse = [...d.courses].sort((a, b) => b.value - a.value)[0];

  return (
    <>
      <div className="head">
        <div>
          <h1>{greet}, {s.name.split(" ").pop()} 👋</h1>
          <p className="bn">আজ {bnNum(d.batchCount)}টি ব্যাচের মধ্যে {bnNum(d.batchesTaken)}টির উপস্থিতি নেওয়া হয়েছে</p>
        </div>
        <div className="actions">
          <Link className="btn btn-s" href="/admin/attendance"><Icon name="calendarCheck" />Attendance</Link>
          <Link className="btn btn-p" href="/admin/students#add"><Icon name="plus" />New admission</Link>
        </div>
      </div>

      <div className="g12">
        <div className="s3"><Kpi dark label="Total students" icon="cap" value={d.total.toLocaleString("en-US")} delta={d.newThisMonth ? `▲ ${d.newThisMonth}` : null} foot={d.newThisMonth ? "এই মাসে নতুন ভর্তি" : `${bnNum(d.batchCount)}টি ব্যাচে`} /></div>
        <div className="s3"><Kpi label="আজকের উপস্থিতি" icon="calendarCheck" tone="ok" value={d.todayPct ?? "—"} unit={d.todayPct !== null ? "%" : undefined}
          foot={d.todayCount ? `${bnNum(d.todayPresent)} / ${bnNum(d.todayCount)} জন` : "আজ এখনো নেওয়া হয়নি"} /></div>
        <div className="s3"><Kpi label="গড় ফলাফল" icon="star" tone="acc" value={d.avgResult} unit="%" delta={fmtDelta(d.resultDelta)} deltaGood={d.resultDelta >= 0} foot="আগের পরীক্ষাগুলোর চেয়ে" /></div>
        <div className="s3"><Kpi label="ঝুঁকিতে আছে" icon="alert" tone="bad" value={d.atRisk.length} valueTone={d.atRisk.length ? "bad" : undefined} foot="নিচে তালিকা দেখুন" /></div>

        <div className="card s8">
          <CardHead title="Attendance & Result Trend" sub="পুরো কোচিং · গত ৮ সপ্তাহ" />
          <LineChart labels={d.weeks.map((w) => w.label)} series={[
            { name: "Attendance %", color: "#4f46e5", values: d.weeks.map((w) => w.att) },
            { name: "Avg result %", color: "#14b8a6", values: d.weeks.map((w) => w.res) },
          ]} />
        </div>

        <div className="card s4">
          <CardHead title="Students by Course" sub="কোন কোর্সে কতজন" />
          <div className="donut-wrap">
            <Donut parts={d.courses.map((c, i) => ({ ...c, color: COURSE_COLORS[i % COURSE_COLORS.length] }))} />
            <div className="dl">{d.courses.map((c, i) => <div key={c.name}><i style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] }} />{c.name}<b className="num">{c.value}</b></div>)}</div>
          </div>
          {topCourse && <div style={{ marginTop: 16 }}><Insight tone="ok" icon="chart">সবচেয়ে বেশি শিক্ষার্থী <b>{topCourse.name}</b> কোর্সে ({bnNum(topCourse.value)} জন)।</Insight></div>}
        </div>

        <div className="card s7">
          <CardHead title="Batch Performance" sub="প্রতিটি ব্যাচের অবস্থা"><Link className="btn btn-s btn-sm" href="/admin/batches">All {d.batchCount} →</Link></CardHead>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Batch</th><th className="hide-mobile">Students</th><th>Attendance</th><th>Result</th><th className="hide-mobile">At-risk</th></tr></thead>
              <tbody>
                {d.batchPerf.map((b) => (
                  <tr key={b.id} className={b.res < 50 ? "row-risk" : ""}>
                    <td><b>{b.name}</b><br /><small style={{ color: "var(--muted)" }}>{b.teachers.slice(0, 2).join(", ") || "Teacher nai"}</small></td>
                    <td className="hide-mobile num">{b.students}</td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="bar" style={{ flex: 1, minWidth: 60 }}><span className={barFor(b.att)} style={{ width: `${b.att}%` }} /></span><b className="num">{b.att}%</b></div></td>
                    <td><span className={`tag ${tagFor(b.res)}`}>{b.res}%</span></td>
                    <td className="hide-mobile num" style={b.risk ? { color: "var(--bad-tx)", fontWeight: 800 } : undefined}>{b.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card s5">
          <CardHead title="যাদের দিকে এখনই নজর দিতে হবে" sub="অনুপস্থিত বা নম্বর অনেক কম">
            <Link className="btn btn-s btn-sm" href="/admin/students?risk=1">All {d.atRisk.length} →</Link>
          </CardHead>
          {d.atRisk.slice(0, 5).map((r) => (
            <div key={r.id} className="li">
              <Link href={`/admin/students/${r.id}`}><Avatar name={r.name} /></Link>
              <div style={{ minWidth: 0 }}>
                <Link href={`/admin/students/${r.id}`} className="ttl">{r.name}</Link>
                <div className="sub">{r.batchName} · <span style={{ color: "var(--bad-tx)" }}>{r.risks.slice(0, 2).join(" · ")}</span></div>
              </div>
              <div className="end"><Link className="btn btn-s btn-sm" href={`/admin/students/${r.id}`}>📞 Guardian</Link></div>
            </div>
          ))}
          {!d.atRisk.length && <div className="empty"><b>🎉</b>কেউ ঝুঁকিতে নেই</div>}
        </div>

        <div className="card s6">
          <CardHead title="Teachers Today" sub="কে উপস্থিতি নিয়েছেন, কার নম্বর দেওয়া বাকি">
            <span className="tag t-ok">{d.batchesTaken}/{d.batchCount} batch done</span>
          </CardHead>
          {d.teacherStatus.map((t) => (
            <div key={t.id} className="teach">
              <Avatar name={t.name} />
              <div><b>{t.name}</b><small className="bn">{t.subject} · {t.batches} batch</small></div>
              <div className="end">
                {t.takenToday ? <span className="tag t-ok">✓ Attendance</span> : <span className="tag t-mut">Attendance —</span>}
                {t.marksMissing ? <span className="tag t-warn">Marks {t.marksMissing} baki</span> : <span className="tag t-ok">✓ Marks</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card s6">
          <CardHead title="Recent Admissions" sub="সর্বশেষ ভর্তি"><Link className="btn btn-s btn-sm" href="/admin/students#add">+ Add</Link></CardHead>
          {d.recentAdmissions.map((st) => (
            <div key={st.id} className="li">
              <Avatar name={st.user.name} />
              <div><Link href={`/admin/students/${st.id}`} className="ttl">{st.user.name}</Link><div className="sub">{st.batch.name} · {st.rollNo}</div></div>
              <span className="end sub">{fmtDate(st.admissionDate.toISOString().slice(0, 10))}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
