import { AppShell, type NavItem } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("STUDENT");
  const st = await prisma.student.findUnique({ where: { userId: s.userId }, include: { batch: true } });
  const fresh = st ? await prisma.notice.count({ where: { OR: [{ batchId: null }, { batchId: st.batchId }], createdAt: { gte: new Date(Date.now() - 3 * 86400000) } } }) : 0;
  const nav: NavItem[] = [
    { href: "/student", label: "Dashboard", icon: "grid", section: "Menu", mobile: "Home" },
    { href: "/student/results", label: "Result & Progress", icon: "chart", mobile: "Result" },
    { href: "/student/attendance", label: "Attendance", icon: "calendarCheck", mobile: "Attend" },
    { href: "/student/notices", label: "Notice", icon: "bell", count: fresh },
    { href: "/student/profile", label: "Amar Profile", icon: "user", section: "Account", mobile: "Profile" },
  ];
  return (
    <AppShell session={s} role="student" portal="Student Portal" nav={nav} bottom={nav.map((n) => n.href)}
      me={{ name: s.name, sub: st?.rollNo ?? "" }}
      sideCard={st && <><b className="bn">{st.batch.name}</b><p className="bn">লক্ষ্য: {st.targetExam ?? "চাকরির পরীক্ষা"} — প্রতিদিন একটু একটু করে এগিয়ে যান!</p></>}>
      {children}
    </AppShell>
  );
}
