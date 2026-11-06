// Edge-safe session helpers (used by middleware and server code)
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN";
/** studentId: for a guardian, the child they logged in with */
export type Session = { userId: string; name: string; role: Role; studentId?: string };

export const SESSION_COOKIE = "cm_session";
const secret = () => {
  // SESSION_SECRET is preferred; without it the (equally secret) database URL is used as the signing key
  const s = process.env.SESSION_SECRET?.trim() || (process.env.DATABASE_URL ? `db:${process.env.DATABASE_URL.trim()}` : "");
  if (!s && process.env.NODE_ENV === "production") throw new Error("Set SESSION_SECRET (or DATABASE_URL) — see .env.example");
  return new TextEncoder().encode(s || "dev-secret-change-me");
};

export async function signSession(s: Session) {
  return new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as string, name: payload.name as string, role: payload.role as Role, studentId: (payload.studentId as string) || undefined };
  } catch {
    return null;
  }
}

export const homeFor = (role: Role) =>
  ({ ADMIN: "/admin", TEACHER: "/teacher", STUDENT: "/student", GUARDIAN: "/guardian" })[role];
