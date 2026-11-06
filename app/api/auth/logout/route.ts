import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

function logout(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const POST = logout;
// GET is used to drop a stale session (account no longer exists)
export const GET = logout;
