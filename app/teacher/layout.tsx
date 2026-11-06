import { AppShell, type NavItem } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subjectLabel } from "@/lib/insights";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("TEACHER");
  const me = await prisma.user.findUnique({ where: { id: s.userId }, include: { subject: true, _count: { select: { teaches: true } } } });
  const nav: NavItem[] = [
    { href: "/teacher", label: "Dashboard", icon: "grid", section: "Amar kaj", mobile: "Home" },
    { href: "/teacher/attendance", label: "Attendance nin", icon: "calendarCheck", mobile: "Attend" },
    { href: "/teacher/exams", label: "Exam & Marks", icon: "pen", mobile: "Marks" },
    { href: "/teacher/students", label: "Amar students", icon: "users", mobile: "Students" },
    { href: "/teacher/profile", label: "Profile", icon: "user", section: "Account" },
  ];
  return (
    <AppShell session={s} role="teacher" portal="Teacher Panel" nav={nav} bottom={nav.map((n) => n.href)} canWorkOffline
      me={{ name: s.name, sub: `${me?.subject ? subjectLabel(me.subject.name) : "Teacher"} · ${me?._count.teaches ?? 0} batch` }}
      sideCard={<><b className="bn">অফলাইনেও কাজ করুন</b><p className="bn">ইন্টারনেট না থাকলেও উপস্থিতি আর নম্বর দিন — নেট এলে নিজেই সেভ হবে।</p></>}>
      {children}
    </AppShell>
  );
}
