import { myStudentDash } from "@/lib/me";
import { CommentsCard, ProgressCard, ResultsTable, SubjectCard } from "@/components/StudentViews";

export default async function StudentResults() {
  const d = await myStudentDash();
  return (
    <>
      <div className="head"><div><h1>Result & Progress</h1><p className="bn">সব পরীক্ষার ফলাফল, বিষয়ভিত্তিক অবস্থা আর শিক্ষকের মন্তব্য</p></div></div>
      <div className="g12">
        <ProgressCard d={d} />
        <SubjectCard d={d} />
        <ResultsTable d={d} span="s12" limit={50} />
        <CommentsCard d={d} span="s12" name="আপনার" />
      </div>
    </>
  );
}
