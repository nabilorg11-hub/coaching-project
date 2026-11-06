"use client";
import { useEffect } from "react";

export const LAST_ONLINE_KEY = "cm-last-online";

/** Keeps <html class="is-offline"> in sync with the network and remembers when we were last online. */
export function ConnectionWatcher() {
  useEffect(() => {
    const apply = () => {
      const off = !navigator.onLine;
      document.documentElement.classList.toggle("is-offline", off);
      if (!off) {
        try { localStorage.setItem(LAST_ONLINE_KEY, String(Date.now())); } catch {}
      }
      window.dispatchEvent(new Event("cm-connection"));
    };
    apply();
    window.addEventListener("online", apply);
    window.addEventListener("offline", apply);
    return () => {
      window.removeEventListener("online", apply);
      window.removeEventListener("offline", apply);
    };
  }, []);
  return null;
}

export function lastOnlineLabel() {
  try {
    const t = Number(localStorage.getItem(LAST_ONLINE_KEY));
    if (!t) return "";
    return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}
