import { AppShell, type NavItem } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GuardianLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("GUARDIAN");
  const child = s.studentId ? await prisma.student.findUnique({ where: { id: s.studentId }, include: { user: true } }) : null;
  const first = child?.user.name.split(" ")[0] ?? "সন্তান";
  const nav: NavItem[] = [
    { href: "/guardian", label: "Overview", icon: "grid", section: "সন্তানের তথ্য", mobile: "Home" },
    { href: "/guardian/results", label: "Result", icon: "chart" },
    { href: "/guardian/attendance", label: "Attendance", icon: "calendarCheck", mobile: "Attend" },
    { href: "/guardian/comments", label: "Teacher montobbo", icon: "message", mobile: "Teacher" },
    { href: "/guardian/contact", label: "Coaching e jogajog", icon: "phone", section: "সাহায্য", mobile: "Call" },
  ];
  return (
    <AppShell session={s} role="guardian" portal="Guardian Portal" nav={nav} bottom={nav.map((n) => n.href)}
      me={{ name: s.name, sub: `অভিভাবক · ${first}` }}
      sideCard={<><b className="bn">শুধু দেখার জন্য</b><p className="bn">এখানে আপনার সন্তানের সব তথ্য দেখা যাবে। কিছু পরিবর্তন করতে কোচিং অফিসে যোগাযোগ করুন।</p></>}>
      {children}
    </AppShell>
  );
}
