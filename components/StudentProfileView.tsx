import type { StudentDash } from "@/lib/insights";
import { Avatar, CardHead } from "./dash";
import { ActionForm } from "./ActionForm";
import { addComment } from "@/app/actions/comments";
import { AttendanceCard, CommentsCard, ProgressCard, ResultsTable, StudentKpis, SubjectCard } from "./StudentViews";

/** Full student report for teacher / admin, with a box to write a remark */
export function StudentProfileView({ d, canComment = true }: { d: StudentDash; canComment?: boolean }) {
  const st = d.student;
  const risks = d.row?.risks ?? [];
  return (
    <div className="g12">
      <div className="card s12" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 22px" }}>
        <Avatar name={st.user.name} size={54} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 19 }}>{st.user.name}</div>
          <div className="muted">{st.rollNo} · {st.batch.name} ({st.batch.course.name}) · {st.user.phone}</div>
        </div>
        {st.guardian && <div className="muted">Guardian: <b>{st.guardian.name}</b> · <a className="link" href={`tel:${st.guardian.phone}`}>{st.guardian.phone}</a></div>}
        {st.status === "INACTIVE" && <span className="tag t-warn">Inactive</span>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginLeft: "auto" }}>
          {risks.length ? risks.map((r) => <span key={r} className="tag t-bad">⚠ {r}</span>) : <span className="tag t-ok">✓ Sob thik ache</span>}
        </div>
      </div>
      <StudentKpis d={d} />
      <ProgressCard d={d} />
      <SubjectCard d={d} />
      <ResultsTable d={d} limit={20} />
      <AttendanceCard d={d} />
      <CommentsCard d={d} span={canComment ? "s7" : "s12"} name={st.user.name.split(" ")[0]} />
      {canComment && (
        <div className="card s5">
          <CardHead title="Montobbo likhun" sub="Student ar guardian duijonei dekhte parbe" />
          <ActionForm action={addComment} submit="Save montobbo">
            <input type="hidden" name="studentId" value={st.id} />
            <textarea name="text" rows={5} required className="input bn" placeholder="যেমন: শতকরা অধ্যায়ে আরও অনুশীলন দরকার…" />
          </ActionForm>
        </div>
      )}
    </div>
  );
}
