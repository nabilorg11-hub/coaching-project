import { myChildDash } from "@/lib/me";
import { ProgressCard, ResultsTable, SimpleResultBars, SubjectCard } from "@/components/StudentViews";

export default async function GuardianResults() {
  const { d } = await myChildDash();
  return (
    <>
      <div className="head"><div><h1>Result</h1><p className="bn">{d.student.user.name}-এর সব পরীক্ষার ফলাফল</p></div></div>
      <div className="g12">
        <SimpleResultBars d={d} />
        <SubjectCard d={d} span="s5" simple />
        <ProgressCard d={d} span="s12" />
        <ResultsTable d={d} span="s12" limit={50} />
      </div>
    </>
  );
}
