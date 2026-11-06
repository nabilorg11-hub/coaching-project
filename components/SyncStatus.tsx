"use client";
import { useEffect, useState } from "react";
import { flush, onSyncChange, pendingCount } from "@/lib/offline/sync";
import { lastOnlineLabel } from "./ConnectionWatcher";

/** Connection pill: Online · synced / Offline · 10:42 AM / ⏳ 3 sync baki */
export function SyncStatus() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [since, setSince] = useState("");

  useEffect(() => {
    const refresh = async () => {
      setOnline(navigator.onLine);
      setSince(lastOnlineLabel());
      setPending(await pendingCount());
    };
    void refresh();
    void flush();
    const off = onSyncChange(() => void refresh());
    window.addEventListener("cm-connection", refresh);
    return () => { off(); window.removeEventListener("cm-connection", refresh); };
  }, []);

  async function syncNow() {
    setSyncing(true);
    await flush();
    setSyncing(false);
  }

  if (!online)
    return (
      <span className="sync off" title="Internet nai — data ei device e save hocche">
        <i />Offline{pending ? ` · ${pending} sync baki` : since ? ` · ${since}` : ""}
      </span>
    );
  if (syncing || pending)
    return (
      <button onClick={syncNow} className="sync ing" style={{ border: 0, cursor: "pointer" }}>
        <i />{syncing ? "Sync hocche…" : `${pending} sync baki`}
      </button>
    );
  return <span className="sync"><i />Online · synced</span>;
}
