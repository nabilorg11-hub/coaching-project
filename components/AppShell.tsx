import Link from "next/link";
import type { Session } from "@/lib/session";
import { avatarTone, initials } from "@/lib/ids";
import { Icon, LogoMark, type IconName } from "./Icons";
import { BottomNav, SideNav } from "./NavLinks";
import { SyncStatus } from "./SyncStatus";
import { OfflineBanner } from "./OfflineBanner";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

export type NavItem = { href: string; label: string; icon: IconName; count?: number; section?: string; mobile?: string };

type Props = {
  session: Session;
  role: "student" | "guardian" | "teacher" | "admin";
  portal: string;
  nav: NavItem[];
  bottom: string[]; // hrefs shown in the mobile tab bar (max 5)
  me: { name: string; sub: string };
  sideCard?: React.ReactNode;
  canWorkOffline?: boolean;
  children: React.ReactNode;
};

export function AppShell({ role, portal, nav, bottom, me, sideCard, canWorkOffline, children }: Props) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return (
    <div data-role={role}>
      <div className="app">
        <aside className="side">
          <Link href={nav[0].href} className="brand"><LogoMark /><div>Shikhon Coaching<small>{portal}</small></div></Link>
          <SideNav nav={nav} />
          {sideCard && <div className="side-card">{sideCard}</div>}
          <div className="me" style={sideCard ? undefined : { marginTop: "auto" }}>
            <div className={`av ${avatarTone(me.name)}`}>{initials(me.name)}</div>
            <div style={{ minWidth: 0 }}><b>{me.name}</b><small>{me.sub}</small></div>
            <LogoutButton />
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <Link href={nav[0].href} className="m-title"><LogoMark size={34} />Shikhon</Link>
            <div className="search"><Icon name="search" size={17} /><span>Search…</span><kbd>Ctrl K</kbd></div>
            <div className="top-r">
              <SyncStatus />
              <div className="pill-date hide-m"><Icon name="calendar" size={16} />{today}</div>
              <ThemeToggle />
              <div className="m-only-logout"><LogoutButton compact /></div>
            </div>
          </div>
          <OfflineBanner canWork={canWorkOffline} />
          {children}
        </main>
      </div>
      <BottomNav nav={nav.filter((n) => bottom.includes(n.href))} />
    </div>
  );
}
