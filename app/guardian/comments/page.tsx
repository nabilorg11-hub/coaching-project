import { myChildDash } from "@/lib/me";
import { CommentsCard, NoticesCard } from "@/components/StudentViews";

export default async function GuardianComments() {
  const { d } = await myChildDash();
  return (
    <>
      <div className="head"><div><h1 className="bn">শিক্ষকের মন্তব্য ও নোটিশ</h1><p className="bn">শিক্ষকরা আপনার সন্তান সম্পর্কে যা বলেছেন</p></div></div>
      <div className="g12">
        <CommentsCard d={d} name={d.student.user.name.split(" ")[0]} />
        <NoticesCard d={d} span="s5" />
      </div>
    </>
  );
}
