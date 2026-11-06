import { ActionForm } from "./ActionForm";
import { changeSecret } from "@/app/actions/account";
import { CardHead } from "./dash";

export function ChangeSecretForm({ pin = false }: { pin?: boolean }) {
  const label = pin ? "PIN" : "Password";
  const extra = pin ? { inputMode: "numeric" as const, maxLength: 6, pattern: "\\d{6}" } : { minLength: 6 };
  return (
    <div className="card">
      <CardHead title={`${label} bodlan`} sub={pin ? "৬ সংখ্যার নতুন PIN দিন" : "কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড দিন"} />
      <ActionForm action={changeSecret} submit={`${label} bodlan`}>
        <label className="block"><span className="field-l">Bortoman {label}</span><input name="current" type="password" required className="input" {...(pin ? { inputMode: "numeric" as const, maxLength: 6 } : {})} /></label>
        <label className="block"><span className="field-l">Notun {label}</span><input name="next" type="password" required className="input" {...extra} /></label>
        <label className="block"><span className="field-l">Notun {label} abar</span><input name="again" type="password" required className="input" {...extra} /></label>
      </ActionForm>
    </div>
  );
}
