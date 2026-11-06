"use client";
import { useEffect, useState } from "react";
import { onSyncChange, pendingCount } from "@/lib/offline/sync";
import { lastOnlineLabel } from "./ConnectionWatcher";
import { Icon } from "./Icons";

/** Shown only while offline (CSS: html.is-offline). Text depends on whether this role can save work offline. */
export function OfflineBanner({ canWork = false }: { canWork?: boolean }) {
  const [since, setSince] = useState("");
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const refresh = async () => { setSince(lastOnlineLabel()); setPending(await pendingCount()); };
    void refresh();
    const off = onSyncChange(() => void refresh());
    window.addEventListener("cm-connection", refresh);
    return () => { off(); window.removeEventListener("cm-connection", refresh); };
  }, []);

  return (
    <div className="offline-banner off-only" role="status">
      <div className="ob-ic"><Icon name="wifiOff" /></div>
      <div>
        <b>{canWork ? "Offline — kaj chaliye jan" : "Internet nai — offline mode"}</b>
        <span>
          {since ? `শেষ আপডেট ${since}। ` : ""}
          {canWork
            ? "উপস্থিতি আর নম্বর এই ডিভাইসে সেভ হবে, ইন্টারনেট এলে নিজেই সার্ভারে যাবে।"
            : "আগে দেখা সব তথ্য দেখতে পারবেন, ইন্টারনেট এলে নতুন তথ্য নিজেই আসবে।"}
        </span>
      </div>
      {pending > 0 && <div className="ob-r"><span className="tag t-warn">⏳ {pending} pending</span></div>}
    </div>
  );
}
