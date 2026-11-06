import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fixDbUrl } from "@/lib/db-url";

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
  // network probe to the database host (only host reachability, no credentials)
  let network: string | undefined;
  if (!database.startsWith("ok") && process.env.DATABASE_URL) {
    try {
      const host = /@([^:/@]+):(\d+)\//.exec(fixDbUrl(process.env.DATABASE_URL) ?? "");
      if (host) {
        const [{ lookup }, net] = await Promise.all([import("node:dns/promises"), import("node:net")]);
        const addrs = await lookup(host[1], { all: true });
        const t0 = Date.now();
        const tcp = await new Promise<string>((res) => {
          const sock = net.connect({ host: host[1], port: Number(host[2]), timeout: 8000 });
          sock.on("connect", () => { sock.destroy(); res(`connected in ${Date.now() - t0}ms`); });
          sock.on("timeout", () => { sock.destroy(); res("timeout"); });
          sock.on("error", (err) => res(`error ${(err as NodeJS.ErrnoException).code}`));
        });
        network = `dns: ${addrs.map((a) => `IPv${a.family}`).join(",")} · tcp ${host[2]}: ${tcp} · region: ${process.env.VERCEL_REGION ?? "?"}`;
        // shape of the URL only (user prefix, lengths, param names) — never the password itself
        const u = new URL(fixDbUrl(process.env.DATABASE_URL)!);
        network += ` · url: user=${u.username.split(".")[0]}.(${u.username.split(".")[1]?.length ?? 0} chars) pwLen=${decodeURIComponent(u.password).length} db=${u.pathname} params=${[...u.searchParams.keys()].join("+")}`;
      }
    } catch (e) {
      network = `probe failed: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`;
    }
  }
  const ok = env.DATABASE_URL && database.startsWith("ok"); // SESSION_SECRET optional (falls back to the DB URL)
  return NextResponse.json({ ok, env, database, detail, network }, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
