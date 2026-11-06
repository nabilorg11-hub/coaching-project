"use client";
import { Icon } from "./Icons";

/** Clears cached pages (so the next user on this device can't see them) — unsynced data in IndexedDB is kept. */
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("pages-")).map((k) => caches.delete(k)));
    } catch {}
    form.submit();
  }
  return (
    <form action="/api/auth/logout" method="post" onSubmit={onSubmit} style={{ marginLeft: compact ? 0 : "auto" }}>
      <button
        className={compact ? "icon-btn" : "logout-btn"}
        title="Logout"
        aria-label="Logout"
        style={compact ? undefined : { border: 0, background: "rgba(255,255,255,.06)", color: "#b3b9d1", width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer" }}
      >
        <Icon name="logout" size={compact ? undefined : 17} />
      </button>
    </form>
  );
}
