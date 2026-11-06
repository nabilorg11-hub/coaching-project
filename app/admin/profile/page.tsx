import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COACHING } from "@/lib/contact";
import { Avatar, CardHead } from "@/components/dash";
import { ChangeSecretForm } from "@/components/ChangeSecretForm";

export default async function AdminProfile() {
  const s = await requireRole("ADMIN");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: s.userId } });
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 });
  return (
    <>
      <div className="head"><div><h1>Settings</h1><p className="bn">অ্যাকাউন্ট, কোচিং-এর তথ্য আর সাম্প্রতিক কার্যক্রম</p></div></div>
      <div className="g12">
        <div className="card s7">
          <div className="child" style={{ marginBottom: 16 }}>
            <Avatar name={me.name} size={58} />
            <div><div style={{ fontWeight: 800, fontSize: 20 }}>{me.name}</div><div className="muted">{me.email ?? me.phone} · Super Admin</div></div>
          </div>
          <CardHead title="Coaching info" sub="Guardian ra ei number e call korbe — .env file e bodlan" />
          <table className="tbl"><tbody>
            <tr><td style={{ color: "var(--muted)", width: 140 }}>Name</td><td><b>{COACHING.name}</b></td></tr>
            <tr><td style={{ color: "var(--muted)" }}>Phone</td><td><b>{COACHING.phone}</b></td></tr>
            <tr><td style={{ color: "var(--muted)" }}>WhatsApp</td><td><b>{COACHING.whatsapp}</b></td></tr>
            <tr><td style={{ color: "var(--muted)" }}>Address</td><td><b>{COACHING.address}</b></td></tr>
          </tbody></table>
          <div style={{ marginTop: 18 }}><CardHead title="Recent activity" /></div>
          {logs.map((l) => <div key={l.id} className="li"><span className="tag t-mut">{l.action}</span><span className="sub">{l.detail}</span><span className="end sub">{l.createdAt.toLocaleString("en-GB")}</span></div>)}
        </div>
        <div className="s5"><ChangeSecretForm /></div>
      </div>
    </>
  );
}
