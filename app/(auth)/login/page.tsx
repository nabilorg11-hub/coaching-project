"use client";
import { useActionState, useState } from "react";
import { login } from "./actions";
import { Icon, LogoMark, type IconName } from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";

type RoleKey = "STUDENT" | "GUARDIAN" | "TEACHER" | "ADMIN";
const ROLES: Record<RoleKey, {
  tab: string; icon: IconName; css: string; idLabel: string; idIcon: IconName; prefix?: string; placeholder: string;
  secretLabel: string; secretPlaceholder: string; sub: string; hint?: string; inputMode?: "numeric" | "tel" | "email" | "text";
}> = {
  STUDENT: { tab: "Student", icon: "cap", css: "student", idLabel: "Student ID", idIcon: "idCard", prefix: "SC-", placeholder: "2026-1001",
    secretLabel: "Password", secretPlaceholder: "••••••", sub: "আপনার অ্যাকাউন্টে লগইন করুন" },
  GUARDIAN: { tab: "Guardian", icon: "users", css: "guardian", idLabel: "সন্তানের Student ID", idIcon: "idCard", prefix: "SC-", placeholder: "2026-1001",
    secretLabel: "Guardian PIN", secretPlaceholder: "৬ সংখ্যার PIN", sub: "আপনার সন্তানের অগ্রগতি দেখুন", inputMode: "numeric",
    hint: "সন্তানের <b>Student ID</b> আর কোচিং থেকে দেওয়া <b>৬ সংখ্যার Guardian PIN</b> দিয়ে লগইন করুন। শুধু আপনার সন্তানের তথ্য দেখতে পারবেন।" },
  TEACHER: { tab: "Teacher", icon: "board", css: "teacher", idLabel: "Mobile number", idIcon: "mobile", placeholder: "01XXXXXXXXX", inputMode: "tel",
    secretLabel: "Password", secretPlaceholder: "••••••", sub: "আপনার বিষয়ের শিক্ষার্থীদের অগ্রগতি দেখুন" },
  ADMIN: { tab: "Admin", icon: "shield", css: "admin", idLabel: "Email / Mobile", idIcon: "user", placeholder: "admin@...", inputMode: "email",
    secretLabel: "Password", secretPlaceholder: "••••••", sub: "পুরো কোচিং এর ড্যাশবোর্ডে প্রবেশ করুন" },
};

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  const [role, setRole] = useState<RoleKey>("STUDENT");
  const [show, setShow] = useState(false);
  const c = ROLES[role];

  return (
    <div className="lg" data-role={c.css}>
      <section className="lg-brand">
        <div className="lg-logo"><LogoMark size={40} /><div>Shikhon Coaching<small>Job Preparation Center</small></div></div>
        <div className="lg-hero">
          <div className="lg-eyebrow"><span className="lg-dot" /><span className="bn">BCS · Bank · Primary প্রস্তুতি</span></div>
          <h1>প্রতিটি শিক্ষার্থীর অগ্রগতি,<br /><span>এক নজরে।</span></h1>
          <p>উপস্থিতি, পরীক্ষার ফলাফল আর দুর্বল বিষয় — সবকিছু এক জায়গায়। শিক্ষার্থী, অভিভাবক আর শিক্ষক সবাই থাকুন আপডেটেড।</p>
          <div className="lg-mchips"><span>📊 Progress</span><span>✅ Attendance</span><span>🏆 Merit list</span></div>
          <div className="lg-float">
            <div className="lg-glass lg-g1">
              <div className="lg-label">মডেল টেস্ট · গড় নম্বর</div>
              <div className="lg-value">78.4% <span className="lg-up">▲ 12%</span></div>
              <svg width="264" height="58" viewBox="0 0 264 58" style={{ marginTop: 6 }}>
                <defs><linearGradient id="lsg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8b7cff" stopOpacity=".55" /><stop offset="1" stopColor="#8b7cff" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 46 L44 40 L88 43 L132 30 L176 33 L220 17 L264 8 L264 58 L0 58Z" fill="url(#lsg)" />
                <path d="M0 46 L44 40 L88 43 L132 30 L176 33 L220 17 L264 8" fill="none" stroke="#b4a9ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="lg-glass lg-g2">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="58" height="58" viewBox="0 0 58 58">
                  <circle cx="29" cy="29" r="23" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="7" />
                  <circle cx="29" cy="29" r="23" fill="none" stroke="#5eead4" strokeWidth="7" strokeLinecap="round" strokeDasharray="133 145" transform="rotate(-90 29 29)" />
                </svg>
                <div><div className="lg-label">এই মাসের উপস্থিতি</div><div className="lg-value" style={{ fontSize: 24 }}>92%</div></div>
              </div>
            </div>
            <div className="lg-glass lg-g3">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="av g1" style={{ width: 34, height: 34 }}>RH</div>
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>Rahim Hossain</div><div className="lg-label">BCS-47 Morning</div></div>
                <span className="bn" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: "rgba(251,191,36,.18)", color: "#fde68a" }}>মেধাতালিকা #৩</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg-foot">
          <div><b>BCS</b>বিসিএস প্রস্তুতি</div>
          <div><b>Bank</b>ব্যাংক জব</div>
          <div><b>Primary</b>প্রাইমারি শিক্ষক</div>
        </div>
      </section>

      <section className="lg-panel">
        <div className="lg-top">
          <span className="sync on-only"><i />Offline-ready</span>
          <span className="sync off off-only"><i />Offline</span>
          <ThemeToggle />
        </div>

        <form action={action} className="lg-shell">
          <h2 className="lg-hello">Welcome back 👋</h2>
          <p className="lg-sub">{c.sub}</p>

          <div className="lg-roles" role="tablist">
            {(Object.keys(ROLES) as RoleKey[]).map((r) => (
              <button key={r} type="button" role="tab" aria-selected={role === r} className={`lg-role ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>
                <Icon name={ROLES[r].icon} />{ROLES[r].tab}
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={role} />

          {c.hint && <div className="lg-hint"><Icon name="info" /><div dangerouslySetInnerHTML={{ __html: c.hint }} /></div>}
          {error && <div className="lg-err" role="alert"><Icon name="alert" size={18} />{error}</div>}

          <div className="lg-field">
            <label htmlFor="id">{c.idLabel}</label>
            <div className="lg-control">
              <Icon name={c.idIcon} />
              {c.prefix && <span className="lg-prefix">{c.prefix}</span>}
              <input key={role} id="id" name="id" required autoComplete="username" inputMode={c.inputMode} placeholder={c.placeholder} />
            </div>
          </div>

          <div className="lg-field">
            <label htmlFor="password"><span>{c.secretLabel}</span></label>
            <div className="lg-control">
              <Icon name="lock" />
              <input key={role} id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password"
                inputMode={role === "GUARDIAN" ? "numeric" : undefined} maxLength={role === "GUARDIAN" ? 6 : undefined} placeholder={c.secretPlaceholder} />
              <button type="button" className="lg-eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"}><Icon name={show ? "eyeOff" : "eye"} /></button>
            </div>
          </div>

          <label className="lg-check"><input type="checkbox" name="remember" defaultChecked />এই ডিভাইসে মনে রাখুন</label>

          <button disabled={pending} className="btn btn-p lg-btn" style={{ justifyContent: "center" }}>
            {pending ? "Login hocche…" : `Login as ${c.tab}`}<Icon name="arrowRight" />
          </button>

          <p className="lg-help">পাসওয়ার্ড/PIN ভুলে গেলে কোচিং অফিসে যোগাযোগ করুন</p>
          <div className="lg-demo">
            <b>Demo login</b> (password / PIN সবার: <b>123456</b>)<br />
            Student / Guardian: <b>2026-1001</b> · Teacher: <b>01711111111</b> · Admin: <b>admin@shikhon.com</b>
          </div>
        </form>
      </section>
    </div>
  );
}
