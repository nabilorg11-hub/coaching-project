import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Setup check: shows only whether settings exist (never their values) and whether the database answers. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
  };
  let database = "not checked";
  let detail: string | undefined;
  try {
    if (env.DATABASE_URL) {
      const users = await prisma.user.count();
      database = users ? `ok (${users} users)` : "connected, but empty — run npm run db:setup";
    }
  } catch (e) {
    const msg = (e as Error).message ?? "";
    // short, sanitized reason (no URLs, hosts or secrets)
    detail = `${(e as { code?: string }).code ?? (e as Error).name}: ${msg.replace(/\w+:\/\/\S+/g, "<url>").replace(/\s+/g, " ").slice(-220)}`;
    database = /Authentication failed|P1000/.test(msg) ? "wrong database password"
      : /Can't reach|P1001|ENOTFOUND|timed out/i.test(msg) ? "cannot reach database host"
      : /does not exist|P2021/.test(msg) ? "tables missing — run npm run db:setup"
      : "error";
  }
  const ok = env.DATABASE_URL && env.SESSION_SECRET && database.startsWith("ok");
  return NextResponse.json({ ok, env, database, detail }, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
