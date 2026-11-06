import Link from "next/link";
import type { StudentDash } from "@/lib/insights";
import { addDays, ago, daysBetween, fmtDate, subjectLabel, weekday } from "@/lib/insights";
import { AttendanceHeatmap, LineChart, SubjectBars, BarsV } from "./charts";
import { Avatar, CardHead, Insight, Kpi, PctTag, bnNum, fmtDelta } from "./dash";
import { Icon } from "./Icons";

/** attendance share per week for the last 6 weeks (sparkline) */
const weeklyAtt = (recs: { date: string; status: string }[], today: string) =>
  [5, 4, 3, 2, 1, 0].map((w) => {
    const r = recs.filter((x) => x.date > addDays(today, -7 * (w + 1)) && x.date <= addDays(today, -7 * w));
    return r.length ? r.filter((x) => x.status !== "ABSENT").length / r.length : null;
  }).filter((v): v is number => v !== null);

const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export function StudentKpis({ d, guardian = false }: { d: StudentDash; guardian?: boolean }) {
  const r = d.row;
  const recentAttended = d.recent.filter((x) => x.status !== "ABSENT").length;
  const daysToExam = d.nextExam ? daysBetween(d.today, d.nextExam.date) : null;
  return (
    <>
      <div className="s3">
        {guardian ? (
          <Kpi label="ক্লাসে এসেছে" icon="calendarCheck" tone="ok" value={recentAttended} unit={` / ${d.recent.length}`}
            foot={`গত ৪ সপ্তাহে · ${bnNum(d.recent.length - recentAttended)} দিন আসেনি`} />
        ) : (
          <Kpi label="উপস্থিতি" icon="calendarCheck" tone="ok" value={d.att4 ?? r?.attPct ?? 0} unit="%"
            delta={fmtDelta(d.attDelta)} deltaGood={(d.attDelta ?? 0) >= 0} foot="গত ৪ সপ্তাহ" sparkColor="#10b981"
            spark={weeklyAtt(d.records, d.today)} />
        )}
      </div>
      <div className="s3">
        <Kpi label="গড় নম্বর" icon="star" tone="acc" value={r?.avgPct ?? 0} unit="%"
          delta={fmtDelta(d.avgDelta)} deltaGood={(d.avgDelta ?? 0) >= 0} foot={guardian ? "শেষ পরীক্ষায়" : `${bnNum(r?.exams.length ?? 0)}টি পরীক্ষায়`}
          spark={r?.exams.map((e) => e.pct)} />
      </div>
      <div className="s3">
        <Kpi label={guardian ? "ব্যাচে অবস্থান" : "মেধাক্রম"} icon="trophy" tone="warn" value={d.last ? `#${d.last.rank}` : "—"} unit={d.last ? ` / ${d.last.outOf}` : undefined}
          delta={d.rankDelta ? `${d.rankDelta > 0 ? "▲" : "▼"} ${Math.abs(d.rankDelta)} ধাপ` : null} deltaGood={d.rankDelta >= 0} foot={d.last ? d.last.title : "এখনো পরীক্ষা হয়নি"} />
      </div>
      <div className="s3">
        <Kpi label="পরের পরীক্ষা" icon="clock" tone="bad" value={daysToExam === null ? "—" : daysToExam === 0 ? "আজ" : daysToExam}
          unit={daysToExam ? " দিন" : undefined} foot={d.nextExam ? `${d.nextExam.title} · ${fmtDate(d.nextExam.date)}` : "কোনো পরীক্ষা নির্ধারিত নেই"} />
      </div>
    </>
  );
}

export function ProgressCard({ d, span = "s8" }: { d: StudentDash; span?: string }) {
  const last = d.progress.at(-1);
  return (
    <div className={`card ${span}`}>
      <CardHead title="Exam Progress" sub="প্রতিটি পরীক্ষায় নম্বর বনাম ব্যাচের গড়">
        {last && last.batch !== null && <span className={`tag ${last.me >= last.batch ? "t-ok" : "t-warn"}`}>{last.me >= last.batch ? "ব্যাচের গড়ের উপরে" : "ব্যাচের গড়ের নিচে"}</span>}
      </CardHead>
      <LineChart labels={d.progress.map((p) => p.label)} badge={fmtDelta(d.avgDelta, "") ?? undefined}
        series={[
          { name: "আমার নম্বর", color: "var(--accent)", values: d.progress.map((p) => p.me) },
          { name: "ব্যাচের গড়", color: "var(--faint)", values: d.progress.map((p) => p.batch), dashed: true },
        ]} />
    </div>
  );
}

export function SubjectCard({ d, span = "s4", simple = false }: { d: StudentDash; span?: string; simple?: boolean }) {
  const subjects = (d.row?.subjects ?? []).map((s) => ({ name: subjectLabel(s.name), pct: s.pct }));
  return (
    <div className={`card ${span}`}>
      <CardHead title={simple ? "বিষয়ভিত্তিক অবস্থা" : "Subject Strength"} sub={simple ? "সবুজ = ভালো · হলুদ = মোটামুটি · লাল = দুর্বল" : "কোন বিষয়ে কেমন করছেন"} />
      <SubjectBars subjects={subjects} />
      {d.weakest && (
        <div style={{ marginTop: 14 }}>
          <Insight tone={d.weakest.pct < 50 ? "bad" : "warn"}>
            <b>{simple ? "পরামর্শ:" : "Tip:"}</b> {subjectLabel(d.weakest.name)}-এ নম্বর সবচেয়ে কম ({Math.round(d.weakest.pct)}%)। প্রতিদিন অন্তত ৩০ মিনিট এই বিষয়ে অনুশীলন করুন।
          </Insight>
        </div>
      )}
    </div>
  );
}

export function ResultsTable({ d, span = "s7", limit = 4, link }: { d: StudentDash; span?: string; limit?: number; link?: string }) {
  const exams = [...(d.row?.exams ?? [])].reverse().slice(0, limit);
  return (
    <div className={`card ${span}`}>
      <CardHead title="Recent Results" sub="সর্বশেষ পরীক্ষার ফলাফল">{link && <Link className="btn btn-s btn-sm" href={link}>সব দেখুন →</Link>}</CardHead>
      {exams.length ? (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Exam</th><th className="hide-mobile">Date</th><th>Marks</th><th>Rank</th><th>%</th></tr></thead>
            <tbody>
              {exams.map((e, i) => {
                const prev = exams[i + 1];
                return (
                  <tr key={e.examId}>
                    <td><b>{e.title}</b></td>
                    <td className="hide-mobile num">{fmtDate(e.date)}</td>
                    <td className="num"><b>{e.obtained}</b>/{e.full}</td>
                    <td className="num">#{e.rank}</td>
                    <td><PctTag pct={e.pct} delta={prev ? (e.pct > prev.pct ? "up" : e.pct < prev.pct ? "down" : "flat") : undefined} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="empty"><b>📝</b>এখনো কোনো পরীক্ষার ফলাফল নেই</div>}
    </div>
  );
}

export function AttendanceCard({ d, span = "s5", title = "Attendance" }: { d: StudentDash; span?: string; title?: string }) {
  const attended = d.recent.filter((x) => x.status !== "ABSENT").length;
  return (
    <div className={`card ${span}`}>
      <CardHead title={title} sub={`গত ৪ সপ্তাহ · ${bnNum(d.recent.length)} ক্লাসের ${bnNum(attended)}টিতে উপস্থিত`}>
        {d.att4 !== null && <span className={`tag ${d.att4 >= 75 ? "t-ok" : "t-bad"}`}><i />{d.att4}%</span>}
      </CardHead>
      <AttendanceHeatmap records={d.records} today={d.today} />
    </div>
  );
}

export function UpcomingCard({ d, span = "s6" }: { d: StudentDash; span?: string }) {
  return (
    <div className={`card ${span}`}>
      <CardHead title="Upcoming" sub="সামনের পরীক্ষা" />
      {d.upcoming.length ? d.upcoming.map((e) => {
        const left = daysBetween(d.today, e.date);
        const full = e.subjects.reduce((a, s) => a + s.fullMarks, 0);
        return (
          <div key={e.id} className="li">
            <div className="date-box" style={left <= 3 ? { background: "var(--bad-bg)", color: "var(--bad-tx)" } : undefined}><b>{e.date.slice(8)}</b><small>{weekday(e.date)}</small></div>
            <div><div className="ttl">{e.title}</div><div className="sub">{full} marks · {e.subjects.length} subject</div></div>
            <span className={`end tag ${left <= 3 ? "t-bad" : "t-acc"}`}>{left === 0 ? "আজ" : `${bnNum(left)} দিন পর`}</span>
          </div>
        );
      }) : <div className="empty"><b>🗓️</b>সামনে কোনো পরীক্ষা নেই</div>}
    </div>
  );
}

export function NoticesCard({ d, span = "s6" }: { d: StudentDash; span?: string }) {
  const fresh = d.notices.filter((n) => Date.now() - n.createdAt.getTime() < 3 * 86400000).length;
  return (
    <div className={`card ${span}`}>
      <CardHead title="Notice Board" sub="কোচিং থেকে নোটিশ">{fresh > 0 && <span className="tag t-bad">{fresh} new</span>}</CardHead>
      {d.notices.length ? d.notices.map((n) => (
        <div key={n.id} className="li">
          <div className="av g5" style={{ borderRadius: 12 }}>{n.icon}</div>
          <div style={{ minWidth: 0 }}><div className="ttl">{n.title}</div><div className="sub">{n.body}</div></div>
          <span className="end sub" style={{ whiteSpace: "nowrap" }}>{ago(n.createdAt)}</span>
        </div>
      )) : <div className="empty"><b>📭</b>কোনো নোটিশ নেই</div>}
    </div>
  );
}

export function CommentsCard({ d, span = "s7", name }: { d: StudentDash; span?: string; name: string }) {
  return (
    <div className={`card ${span}`}>
      <CardHead title="শিক্ষকের মন্তব্য" sub={`শিক্ষকরা ${name} সম্পর্কে যা বলেছেন`} />
      {d.comments.length ? d.comments.map((c) => (
        <div key={c.id} className="quote">
          <p>“{c.text}”</p>
          <div className="by"><Avatar name={c.author.name} /><b>{c.author.name}</b>{c.author.subject && <> · <span className="bn">{subjectLabel(c.author.subject.name)}</span></>} · {fmtDate(c.createdAt.toISOString().slice(0, 10))}</div>
        </div>
      )) : <div className="empty"><b>💬</b>এখনো কোনো মন্তব্য নেই</div>}
    </div>
  );
}

export function SimpleResultBars({ d, span = "s7" }: { d: StudentDash; span?: string }) {
  const items = (d.row?.exams ?? []).slice(-5).map((e) => ({ label: e.title.replace("Weekly Test", "Weekly").replace("Model Test", "Model"), pct: e.pct }));
  const improving = (d.avgDelta ?? 0) >= 0;
  return (
    <div className={`card ${span}`}>
      <CardHead title="পরীক্ষার ফলাফল" sub="প্রতিটি পরীক্ষায় কত শতাংশ নম্বর পেয়েছে">
        {items.length > 1 && <span className={`tag ${improving ? "t-ok" : "t-bad"}`}>{improving ? "▲ উন্নতি হচ্ছে" : "▼ কমছে"}</span>}
      </CardHead>
      <BarsV items={items} />
      <div style={{ marginTop: 14 }}>
        <Insight tone="acc" icon="chart">৭৫%-এর উপরে মানে <b>খুব ভালো</b>, ৫০%-এর নিচে মানে <b>সাহায্য দরকার</b>।</Insight>
      </div>
    </div>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  return <span className="tag t-acc"><Icon name="trophy" size={13} /> {ordinal(rank)}</span>;
}
