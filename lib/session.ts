// Edge-safe session helpers (used by middleware and server code)
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN";
/** studentId: for a guardian, the child they logged in with */
export type Session = { userId: string; name: string; role: Role; studentId?: string };

export const SESSION_COOKIE = "cm_session";
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set — copy .env.example to .env");
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
