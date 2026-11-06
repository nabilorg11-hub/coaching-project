import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { studentRows } from "@/lib/analytics";
import { StudentTable } from "@/components/ui";
import { ActionForm, Field } from "@/components/ActionForm";
import { CardHead } from "@/components/dash";
import { Icon } from "@/components/Icons";
import { addStudent, importStudents } from "../actions";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ batch?: string; q?: string; risk?: string }> }) {
  const { batch, q, risk } = await searchParams;
  const batches = await prisma.batch.findMany({ orderBy: { name: "asc" } });
  let rows = await studentRows(batch ? [batch] : undefined);
  if (q) {
    const t = q.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(t) || r.rollNo.toLowerCase().includes(t) || r.phone.includes(t));
  }
  if (risk) rows = rows.filter((r) => r.risks.length);
  const inactive = await prisma.student.count({ where: { status: "INACTIVE" } });

  return (
    <>
      <div className="head">
        <div><h1>{risk ? "At-risk students" : "Students"} ({rows.length})</h1><p className="bn">নাম চাপলে পুরো রিপোর্ট, গার্ডিয়ানের নম্বর আর ব্যবস্থাপনা</p></div>
        <div className="actions"><a href="#add" className="btn btn-p"><Icon name="plus" />New admission</a></div>
      </div>

      <form className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: "1 1 220px" }}><Field label="Search"><input name="q" defaultValue={q} placeholder="Name / Student ID / phone" className="input" /></Field></div>
        <div style={{ flex: "1 1 180px" }}>
          <Field label="Batch">
            <select name="batch" defaultValue={batch ?? ""} className="input">
              <option value="">Sob batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </div>
        <label className="lg-check" style={{ margin: "0 0 12px" }}><input type="checkbox" name="risk" value="1" defaultChecked={!!risk} />শুধু ঝুঁকিতে থাকা</label>
        <button className="btn-ghost">Filter</button>
        {(q || batch || risk) && <Link href="/admin/students" className="link" style={{ marginBottom: 12 }}>Clear</Link>}
      </form>

      <StudentTable rows={rows} linkBase="/admin/students" />
      {inactive > 0 && <p className="muted" style={{ marginTop: 8 }}>{inactive} jon inactive student list e dekhano hocche na.</p>}

      <div id="add" className="g12" style={{ marginTop: 18 }}>
        <div className="card s7">
          <CardHead title="Notun student admission" sub="Student ID ar Guardian PIN nijei toiri hobe" />
          <ActionForm action={addStudent} submit="Admission">
            <div className="form-grid">
              <Field label="Name *"><input name="name" required className="input" /></Field>
              <Field label="Mobile *"><input name="phone" required pattern="01\d{9}" placeholder="01XXXXXXXXX" className="input" /></Field>
              <Field label="Batch *">
                <select name="batchId" required className="input">{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              </Field>
              <Field label="Address"><input name="address" className="input" /></Field>
              <Field label="Guardian name"><input name="guardianName" className="input" /></Field>
              <Field label="Guardian mobile"><input name="guardianPhone" pattern="01\d{9}" className="input" /></Field>
              <Field label="Relation">
                <select name="relation" className="input"><option>Father</option><option>Mother</option><option>Brother</option><option>Other</option></select>
              </Field>
            </div>
            <p className="muted bn">শিক্ষার্থীর পাসওয়ার্ড = মোবাইলের শেষ ৬ সংখ্যা। গার্ডিয়ান লগইন করবেন Student ID + Guardian PIN দিয়ে।</p>
          </ActionForm>
        </div>

        <div className="card s5">
          <CardHead title="Bulk import (CSV / Excel)" sub="Excel e Save as CSV kore upload korun" />
          <p className="muted" style={{ marginTop: -6, marginBottom: 10 }}>Column: <code>name,phone,batch,guardian_name,guardian_phone,address</code></p>
          <ActionForm action={importStudents} submit="Import">
            <input type="file" name="file" accept=".csv,text/csv" className="muted" />
            <textarea name="csv" rows={5} className="input" style={{ fontFamily: "monospace" }} placeholder={`name,phone,batch,guardian_name,guardian_phone,address\nRahat Khan,01812345678,${batches[0]?.name ?? "BCS-47 Morning"},Abdul Khan,01912345678,Mirpur`} />
          </ActionForm>
        </div>
      </div>
    </>
  );
}
