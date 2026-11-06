import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subjectLabel } from "@/lib/insights";
import { Avatar, CardHead } from "@/components/dash";
import { ChangeSecretForm } from "@/components/ChangeSecretForm";

export default async function TeacherProfile() {
  const s = await requireRole("TEACHER");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: s.userId }, include: { subject: true, teaches: { include: { batch: true } } } });
  return (
    <>
      <div className="head"><div><h1>Profile</h1><p className="bn">আপনার তথ্য ও পাসওয়ার্ড</p></div></div>
      <div className="g12">
        <div className="card s7">
          <div className="child" style={{ marginBottom: 16 }}>
            <Avatar name={me.name} size={58} />
            <div><div style={{ fontWeight: 800, fontSize: 20 }}>{me.name}</div><div className="muted">{me.phone}</div></div>
          </div>
          <CardHead title="Amar subject ar batch" />
          <p><span className="tag t-acc">{me.subject ? subjectLabel(me.subject.name) : "Subject set kora hoyni"}</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{me.teaches.map((t) => <span key={t.batchId} className="tag t-mut">{t.batch.name}</span>)}</div>
        </div>
        <div className="s5"><ChangeSecretForm /></div>
      </div>
    </>
  );
}
