import { myStudentDash } from "@/lib/me";
import { NoticesCard, UpcomingCard } from "@/components/StudentViews";

export default async function StudentNotices() {
  const d = await myStudentDash();
  return (
    <>
      <div className="head"><div><h1>Notice</h1><p className="bn">কোচিং থেকে সব নোটিশ আর সামনের পরীক্ষা</p></div></div>
      <div className="g12">
        <NoticesCard d={d} span="s7" />
        <UpcomingCard d={d} span="s5" />
      </div>
    </>
  );
}
