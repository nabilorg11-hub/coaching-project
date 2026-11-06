import { myStudentDash } from "@/lib/me";
import { AttendanceCard } from "@/components/StudentViews";
import { CardHead, Kpi, bnNum } from "@/components/dash";
import { fmtDate, weekday } from "@/lib/insights";

export default async function StudentAttendance() {
  const d = await myStudentDash();
  const all = [...d.records].sort((a, b) => b.date.localeCompare(a.date));
  const absent = all.filter((r) => r.status === "ABSENT");
  const late = all.filter((r) => r.status === "LATE");
  return (
    <>
      <div className="head"><div><h1>Attendance</h1><p className="bn">আপনার উপস্থিতির পুরো হিসাব</p></div></div>
      <div className="g12">
        <div className="s4"><Kpi label="মোট উপস্থিতি" icon="calendarCheck" tone="ok" value={d.row?.attPct ?? 0} unit="%" foot={`${bnNum(all.length)}টি ক্লাস`} /></div>
        <div className="s4"><Kpi label="অনুপস্থিত" icon="alert" tone="bad" value={absent.length} unit=" দিন" foot={d.row?.absentStreak ? `শেষ ${bnNum(d.row.absentStreak)} দিন টানা` : "নিয়মিত আসছেন"} /></div>
        <div className="s4"><Kpi label="দেরিতে এসেছেন" icon="clock" tone="warn" value={late.length} unit=" দিন" /></div>
        <AttendanceCard d={d} span="s6" />
        <div className="card s6">
          <CardHead title="যেদিন আসেননি" sub="অনুপস্থিত দিনের তালিকা" />
          {absent.length ? absent.slice(0, 12).map((a) => (
            <div key={a.date} className="li">
              <div className="date-box" style={{ background: "var(--bad-bg)", color: "var(--bad-tx)" }}><b>{a.date.slice(8)}</b><small>{weekday(a.date)}</small></div>
              <div><div className="ttl">{fmtDate(a.date)}</div><div className="sub">Absent</div></div>
            </div>
          )) : <div className="empty"><b>🎉</b>একদিনও অনুপস্থিত নেই!</div>}
        </div>
      </div>
    </>
  );
}
