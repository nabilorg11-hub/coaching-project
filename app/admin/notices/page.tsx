import { prisma } from "@/lib/prisma";
import { ago } from "@/lib/insights";
import { ActionForm, Field } from "@/components/ActionForm";
import { CardHead } from "@/components/dash";
import { addNotice, deleteNotice } from "../actions";

const ICONS = ["📢", "📚", "🏆", "📝", "⚠️", "🎉"];

export default async function NoticesPage() {
  const [notices, batches] = await Promise.all([
    prisma.notice.findMany({ include: { batch: true, author: true }, orderBy: { createdAt: "desc" } }),
    prisma.batch.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <div className="head"><div><h1>Notice</h1><p className="bn">নোটিশ দিলে শিক্ষার্থী আর অভিভাবক দুজনেই ড্যাশবোর্ডে দেখবেন</p></div></div>
      <div className="g12">
        <div className="card s7">
          <CardHead title={`Sob notice (${notices.length})`} />
          {notices.map((n) => (
            <div key={n.id} className="li">
              <div className="av g5" style={{ borderRadius: 12 }}>{n.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="ttl">{n.title}</div>
                <div className="sub">{n.body}</div>
                <div className="sub">{n.batch ? n.batch.name : "Sobar jonno"} · {n.author.name} · {ago(n.createdAt)}</div>
              </div>
              <form action={deleteNotice} className="end"><input type="hidden" name="id" value={n.id} /><button className="btn btn-s btn-sm" style={{ color: "var(--bad-tx)" }}>Delete</button></form>
            </div>
          ))}
          {!notices.length && <div className="empty"><b>📭</b>Kono notice nai</div>}
        </div>
        <div className="card s5">
          <CardHead title="Notun notice" />
          <ActionForm action={addNotice} submit="Prokash korun">
            <Field label="Title *"><input name="title" required className="input" placeholder="যেমন: শুক্রবার বিশেষ মডেল টেস্ট" /></Field>
            <Field label="Lekha *"><textarea name="body" rows={4} required className="input" /></Field>
            <div className="form-grid">
              <Field label="Kader jonno">
                <select name="batchId" className="input"><option value="">Sobar jonno</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              </Field>
              <Field label="Icon">
                <select name="icon" className="input">{ICONS.map((i) => <option key={i}>{i}</option>)}</select>
              </Field>
            </div>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
