import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, homeFor } from "@/lib/session";

const areas: Record<string, string> = { "/admin": "ADMIN", "/teacher": "TEACHER", "/student": "STUDENT", "/guardian": "GUARDIAN" };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/" || pathname === "/login") {
    if (s) return NextResponse.redirect(new URL(homeFor(s.role), req.url));
    if (pathname === "/") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  const area = Object.keys(areas).find((a) => pathname === a || pathname.startsWith(a + "/"));
  if (area) {
    if (!s) return NextResponse.redirect(new URL("/login", req.url));
    if (s.role !== areas[area]) return NextResponse.redirect(new URL(homeFor(s.role), req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*", "/student/:path*", "/guardian/:path*"] };
