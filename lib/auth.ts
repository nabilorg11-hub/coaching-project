import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySession, type Role } from "./session";

export async function getSession() {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

/** one DB check per request: does the account in the cookie still exist with this role? */
const accountExists = cache(async (userId: string, role: Role) =>
  !!(await prisma.user.findFirst({ where: { id: userId, role }, select: { id: true } })),
);

export async function requireRole(...roles: Role[]) {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) redirect("/login");
  // account deleted / database reset -> clear the stale cookie instead of showing errors
  if (!(await accountExists(s.userId, s.role))) redirect("/api/auth/logout");
  return s;
}
