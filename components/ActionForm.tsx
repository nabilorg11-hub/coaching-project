"use client";
import { useActionState, useEffect, useRef } from "react";

type State = { ok?: string; error?: string } | null;

export function ActionForm({
  action, children, className = "space-y-3", submit = "Save", resetOnOk = true,
}: {
  action: (s: State, f: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
  submit?: string;
  resetOnOk?: boolean;
}) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && !state.error && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">{pending ? "Save hocche…" : submit}</button>
      </div>
      {state?.ok && <div className="insight t-ok" style={{ whiteSpace: "pre-wrap" }}>✓ {state.ok}</div>}
      {state?.error && <div className="insight t-bad" style={{ whiteSpace: "pre-wrap" }}>{state.error}</div>}
    </form>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-l">{label}</span>
      <div>{children}</div>
    </label>
  );
}
