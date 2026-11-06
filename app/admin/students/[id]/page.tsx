import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { studentDashboard } from "@/lib/insights";
import { StudentProfileView } from "@/components/StudentProfileView";
import { ActionForm } from "@/components/ActionForm";
import { CardHead } from "@/components/dash";
import { moveStudent, resetGuardianPin, resetPassword, setStudentStatus } from "../../actions";

export default async function AdminStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await studentDashboard(id);
  if (!d) notFound();
  const batches = await prisma.batch.findMany({ orderBy: { name: "asc" } });
  const st = d.student;

  return (
    <>
      <Link href="/admin/students" className="back">← Students</Link>
      <StudentProfileView d={d} />

      <div className="card" style={{ marginTop: 18 }}>
        <CardHead title="Manage" sub="Batch bodlano, inactive kora, password/PIN reset" />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16 }}>
          <form action={moveStudent} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <input type="hidden" name="id" value={st.id} />
            <label><span className="field-l">Batch change</span>
              <select name="batchId" defaultValue={st.batchId} className="input">{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </label>
            <button className="btn-ghost">Move</button>
          </form>
          <form action={setStudentStatus}>
            <input type="hidden" name="id" value={st.id} />
            <input type="hidden" name="status" value={st.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
            <button className={st.status === "ACTIVE" ? "btn-danger" : "btn-primary"}>{st.status === "ACTIVE" ? "Inactive koro (chere geche)" : "Active koro"}</button>
          </form>
          <form action={resetPassword}>
            <input type="hidden" name="userId" value={st.userId} />
            <button className="btn-ghost">Student password reset</button>
          </form>
          <div style={{ minWidth: 260 }}>
            <ActionForm action={resetGuardianPin} submit="Notun Guardian PIN" resetOnOk={false} className="">
              <input type="hidden" name="id" value={st.id} />
            </ActionForm>
          </div>
        </div>
        <p className="muted bn" style={{ marginTop: 10 }}>পাসওয়ার্ড রিসেট করলে নতুন পাসওয়ার্ড = মোবাইলের শেষ ৬ সংখ্যা।</p>
      </div>
    </>
  );
}
