import { myStudentDash } from "@/lib/me";
import { Avatar, CardHead } from "@/components/dash";
import { ChangeSecretForm } from "@/components/ChangeSecretForm";

export default async function StudentProfile() {
  const d = await myStudentDash();
  const st = d.student;
  const rows: [string, string][] = [
    ["Student ID", st.rollNo], ["Mobile", st.user.phone], ["Batch", st.batch.name], ["Course", st.batch.course.name],
    ["Admission", st.admissionDate.toLocaleDateString("en-GB")], ["Address", st.address ?? "—"],
    ["Guardian", st.guardian ? `${st.guardian.name} (${st.guardian.phone})` : "—"],
  ];
  return (
    <>
      <div className="head"><div><h1>Amar Profile</h1><p className="bn">আপনার তথ্য — ভুল থাকলে কোচিং অফিসে জানান</p></div></div>
      <div className="g12">
        <div className="card s7">
          <div className="child" style={{ marginBottom: 18 }}>
            <Avatar name={st.user.name} size={58} />
            <div><div style={{ fontWeight: 800, fontSize: 20 }}>{st.user.name}</div><div className="muted">{st.rollNo}</div></div>
          </div>
          <CardHead title="তথ্য" />
          <table className="tbl"><tbody>
            {rows.map(([k, v]) => <tr key={k}><td style={{ color: "var(--muted)", width: 140 }}>{k}</td><td><b>{v}</b></td></tr>)}
          </tbody></table>
        </div>
        <div className="s5"><ChangeSecretForm /></div>
      </div>
    </>
  );
}
