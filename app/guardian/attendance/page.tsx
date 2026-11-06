import { myChildDash } from "@/lib/me";
import { AttendanceCard } from "@/components/StudentViews";
import { CardHead, Kpi, bnNum } from "@/components/dash";
import { fmtDate, weekday } from "@/lib/insights";

export default async function GuardianAttendance() {
  const { d } = await myChildDash();
  const all = [...d.records].sort((a, b) => b.date.localeCompare(a.date));
  const absent = all.filter((r) => r.status === "ABSENT");
  return (
    <>
      <div className="head"><div><h1>Attendance</h1><p className="bn">{d.student.user.name} কোন দিন ক্লাসে এসেছে, কোন দিন আসেনি</p></div></div>
      <div className="g12">
        <div className="s4"><Kpi label="মোট উপস্থিতি" icon="calendarCheck" tone="ok" value={d.row?.attPct ?? 0} unit="%" foot={`${bnNum(all.length)}টি ক্লাসের মধ্যে`} /></div>
        <div className="s4"><Kpi label="আসেনি" icon="alert" tone="bad" value={absent.length} unit=" দিন" foot={d.row?.absentStreak ? `শেষ ${bnNum(d.row.absentStreak)} দিন টানা আসেনি` : "নিয়মিত আসছে"} /></div>
        <div className="s4"><Kpi label="গত ৪ সপ্তাহ" icon="calendar" tone="acc" value={d.att4 ?? 0} unit="%" /></div>
        <AttendanceCard d={d} span="s6" title="ক্লাসে উপস্থিতি" />
        <div className="card s6">
          <CardHead title="যেদিন আসেনি" sub="অনুপস্থিত দিনের তালিকা" />
          {absent.length ? absent.slice(0, 12).map((a) => (
            <div key={a.date} className="li">
              <div className="date-box" style={{ background: "var(--bad-bg)", color: "var(--bad-tx)" }}><b>{a.date.slice(8)}</b><small>{weekday(a.date)}</small></div>
              <div><div className="ttl">{fmtDate(a.date)}</div><div className="sub bn">ক্লাসে আসেনি</div></div>
            </div>
          )) : <div className="empty"><b>🎉</b>একদিনও অনুপস্থিত নেই!</div>}
        </div>
      </div>
    </>
  );
}
