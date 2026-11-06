import { myStudentDash } from "@/lib/me";
import { Ring } from "@/components/charts";
import { bnNum } from "@/components/dash";
import { subjectLabel, fmtDate } from "@/lib/insights";
import { AttendanceCard, NoticesCard, ProgressCard, ResultsTable, StudentKpis, SubjectCard, UpcomingCard } from "@/components/StudentViews";

export default async function StudentHome() {
  const d = await myStudentDash();
  const r = d.row;
  const first = d.student.user.name.split(" ")[0];
  const good = r && r.risks.length === 0 && r.avgPct >= 60;

  return (
    <div className="g12">
      <section className="hero s12">
        <div className="hero-l">
          <div className="hi">Assalamu Alaikum 👋</div>
          <h2>{first}, {good ? "আপনি দারুণ করছেন!" : r?.risks.length ? "চলুন আরেকটু চেষ্টা করি!" : "আপনি ভালো পথে আছেন!"}</h2>
          <div className="verdict">
            উপস্থিতি <b>{bnNum(d.att4 ?? r?.attPct ?? 0)}%</b>, গড় নম্বর <b>{bnNum(r?.avgPct ?? 0)}%</b>
            {d.avgDelta ? <> — আগের পরীক্ষার চেয়ে <b>{bnNum(Math.abs(d.avgDelta))}% {d.avgDelta > 0 ? "বেশি" : "কম"}</b></> : null}।
            {d.weakest && <> শুধু <b>{subjectLabel(d.weakest.name)}</b>-এ একটু বেশি সময় দিন।</>}
          </div>
          <div className="chips">
            <span className="chip">🎓 {d.student.batch.name}</span>
            {d.last && <span className="chip">🏆 মেধাক্রম #{d.last.rank} / {d.last.outOf}</span>}
            {d.nextExam && <span className="chip">📝 {d.nextExam.title} · {fmtDate(d.nextExam.date)}</span>}
          </div>
        </div>
        <div className="hero-r"><Ring pct={r?.avgPct ?? 0} /></div>
      </section>

      <StudentKpis d={d} />
      <ProgressCard d={d} />
      <SubjectCard d={d} />
      <ResultsTable d={d} link="/student/results" />
      <AttendanceCard d={d} />
      <UpcomingCard d={d} />
      <NoticesCard d={d} />
    </div>
  );
}
