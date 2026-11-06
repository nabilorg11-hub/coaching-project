"use client";
import { useEffect } from "react";

const RECOVER_KEY = "cm-recovered-at";

/** Drop the service worker + cached pages, then load fresh from the server. */
async function hardReload() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
  location.reload();
}

// An old cached page talking to a newer server ("Server Action ... not found", missing chunk)
const isStaleBuild = (e: Error) => /server action|failed to find|chunkloaderror|loading chunk/i.test(`${e.name} ${e.message}`);

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (!isStaleBuild(error)) return;
    // recover automatically once per minute (avoids a reload loop)
    try {
      const last = Number(sessionStorage.getItem(RECOVER_KEY) || 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(RECOVER_KEY, String(Date.now()));
    } catch {}
    void hardReload();
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="card max-w-sm space-y-3 text-center">
        <h1 className="h2">Kichu ekta vul hoyeche</h1>
        <p className="muted">App update hoye thakte pare. Reload chaple purono cache muche notun kore khulbe.</p>
        <div className="flex justify-center gap-2">
          <button className="btn-primary" onClick={() => void hardReload()}>Reload</button>
          <button className="btn-ghost" onClick={() => reset()}>Abar cheshta</button>
        </div>
        {error.digest && <p className="muted" style={{ fontSize: 11 }}>Error code: {error.digest}</p>}
      </div>
    </main>
  );
}
