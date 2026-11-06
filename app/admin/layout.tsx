import { AppShell, type NavItem } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { studentRows } from "@/lib/analytics";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("ADMIN");
  const risk = (await studentRows()).filter((r) => r.risks.length).length;
  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "grid", section: "Overview", mobile: "Home" },
    { href: "/admin/students?risk=1", label: "At-risk students", icon: "alert", count: risk, mobile: "At-risk" },
    { href: "/admin/students", label: "Students", icon: "cap", section: "Manage" },
    { href: "/admin/teachers", label: "Teachers", icon: "board" },
    { href: "/admin/batches", label: "Batch & Course", icon: "list", mobile: "Batch" },
    { href: "/admin/attendance", label: "Attendance", icon: "calendarCheck", mobile: "Attend" },
    { href: "/admin/exams", label: "Exams & Result", icon: "bookmark", mobile: "Exams" },
    { href: "/admin/notices", label: "Notice", icon: "bell" },
    { href: "/admin/profile", label: "Settings", icon: "settings", section: "Account" },
  ];
  return (
    <AppShell session={s} role="admin" portal="Admin Console" nav={nav} canWorkOffline
      bottom={["/admin", "/admin/students", "/admin/attendance", "/admin/exams", "/admin/batches"]}
      me={{ name: s.name, sub: "Super Admin" }}>
      {children}
    </AppShell>
  );
}
