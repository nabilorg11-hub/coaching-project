// Interactive helper: asks for the Supabase connection strings + database password,
// writes them into .env (keeps everything else), then creates tables and demo data.
// Run:  npm run setup:supabase
import fs from "node:fs";
import readline from "node:readline";
import { execSync } from "node:child_process";

const ENV = ".env";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
const ask = (q) => new Promise((r) => rl.question(q, (a) => r(a.trim())));

function askHidden(q) {
  return new Promise((resolve) => {
    const out = rl.output;
    const write = out.write.bind(out);
    out.write(q);
    rl._writeToOutput = (s) => { if (s.includes("\n") || s.includes("\r")) write("\n"); else write("*"); };
    rl.question("", (a) => { rl._writeToOutput = (s) => write(s); resolve(a.trim()); });
  });
}

/** accepts a whole line like DATABASE_URL="postgresql://..." or just the URL */
const cleanUrl = (raw) => raw.replace(/^\s*[A-Z_]+\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();

function withPassword(url, pw) {
  const u = new URL(url);
  if (!u.hostname.includes("supabase")) throw new Error("Eta Supabase er URL mone hocche na: " + u.hostname);
  u.password = encodeURIComponent(pw);
  return u.toString();
}

console.log("\n=== Supabase setup ===");
console.log("Supabase -> apnar project -> Connect -> ORMs -> Prisma theke line gulo copy korun.\n");

try {
  const pooled = cleanUrl(await ask("1) DATABASE_URL (port 6543 er line ta paste kore Enter): "));
  const direct = cleanUrl(await ask("2) DIRECT_URL  (port 5432 er line ta paste kore Enter): "));
  const pw = await askHidden("3) Database password (type korle * dekhabe, tarpor Enter): ");
  if (!pooled.startsWith("postgres") || !direct.startsWith("postgres")) throw new Error("Line duita postgresql:// diye shuru hote hobe");
  if (!pw) throw new Error("Password dorkar");

  let dbUrl = withPassword(pooled, pw);
  if (!dbUrl.includes("pgbouncer=true")) dbUrl += (dbUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
  const directUrl = withPassword(direct, pw);

  let env = fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8") : "";
  env = env.split(/\r?\n/).filter((l) => !/^(DATABASE_URL|DIRECT_URL)=/.test(l) && !/^# TODO: Supabase/.test(l)).join("\n");
  if (!/^SESSION_SECRET=/m.test(env)) {
    const secret = (await import("node:crypto")).randomBytes(32).toString("hex");
    env += `\nSESSION_SECRET="${secret}"`;
  }
  env = `DATABASE_URL="${dbUrl}"\nDIRECT_URL="${directUrl}"\n` + env.replace(/^\n+/, "");
  fs.writeFileSync(ENV, env.endsWith("\n") ? env : env + "\n");
  console.log("\n✓ .env e save hoyeche. Ebar Supabase e table ar demo data banano hocche (1-2 minute)…\n");
  rl.close();

  execSync("npm run db:setup", { stdio: "inherit" });
  console.log("\n✓ Sob hoye geche! Claude ke bolun: \"setup hoyeche\"\n");
} catch (e) {
  rl.close();
  console.error("\n✗ Somossha: " + (e?.message ?? e));
  console.error("Abar chalate: npm run setup:supabase\n");
  process.exit(1);
}
