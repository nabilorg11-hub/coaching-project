"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./AppShell";
import { Icon } from "./Icons";

function useActive() {
  const path = usePathname();
  return (href: string, all: NavItem[]) => {
    if (path === href) return true;
    // the longest matching prefix wins, so /admin doesn't light up on /admin/students
    const matches = all.filter((n) => path.startsWith(n.href + "/"));
    const best = matches.sort((a, b) => b.href.length - a.href.length)[0];
    return best?.href === href;
  };
}

export function SideNav({ nav }: { nav: NavItem[] }) {
  const isActive = useActive();
  let lastSection: string | undefined;
  return (
    <>
      {nav.map((n) => {
        const header = n.section && n.section !== lastSection ? <div className="side-label">{n.section}</div> : null;
        lastSection = n.section ?? lastSection;
        return (
          <div key={n.href}>
            {header}
            <Link href={n.href} className={`nav ${isActive(n.href, nav) ? "on" : ""}`}>
              <Icon name={n.icon} />
              {n.label}
              {n.count ? <span className="count">{n.count}</span> : null}
            </Link>
          </div>
        );
      })}
    </>
  );
}

export function BottomNav({ nav }: { nav: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav className="bottom-nav">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} className={isActive(n.href, nav) ? "on" : ""}>
          <Icon name={n.icon} />
          {n.mobile ?? n.label}
        </Link>
      ))}
    </nav>
  );
}
