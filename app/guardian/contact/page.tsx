import { myChildDash } from "@/lib/me";
import { COACHING } from "@/lib/contact";
import { CardHead } from "@/components/dash";
import { Icon } from "@/components/Icons";
import { ChangeSecretForm } from "@/components/ChangeSecretForm";

export default async function GuardianContact() {
  const { d } = await myChildDash();
  return (
    <>
      <div className="head"><div><h1 className="bn">কোচিং-এ যোগাযোগ</h1><p className="bn">যেকোনো প্রশ্ন বা সমস্যায় সরাসরি কল করুন</p></div></div>
      <div className="g12">
        <div className="card s7">
          <CardHead title={COACHING.name} sub={COACHING.address} />
          <div style={{ display: "grid", gap: 10 }}>
            <a className="btn btn-p" style={{ justifyContent: "center", height: 52, fontSize: 15 }} href={`tel:${COACHING.phone}`}><Icon name="phone" />কল করুন · {COACHING.phone}</a>
            <a className="btn btn-s" style={{ justifyContent: "center", height: 52, fontSize: 15 }} href={`https://wa.me/${COACHING.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" style={{ color: "#16a34a" }} />WhatsApp-এ মেসেজ</a>
          </div>
          <p className="muted bn" style={{ marginTop: 14 }}>শিক্ষার্থী: <b>{d.student.user.name}</b> ({d.student.rollNo}) · {d.student.batch.name}</p>
        </div>
        <div className="s5"><ChangeSecretForm pin /></div>
      </div>
    </>
  );
}
