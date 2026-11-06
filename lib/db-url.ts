/**
 * Makes a pasted database URL usable: strips quotes/whitespace and URL-encodes a raw password
 * (Supabase passwords often contain # ? % @ which break the URL when pasted as-is, e.g. on Vercel).
 */
export function fixDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const url = raw.trim().replace(/^["']|["']$/g, "").trim();
  // user:password@host — password is everything between the first ":" after the user and the LAST "@"
  const m = url.match(/^(postgres(?:ql)?:\/\/[^:/@]+:)(.*)@([^@/]+(?::\d+)?\/.*)$/);
  if (!m) return url;
  const pw = m[2];
  try {
    decodeURIComponent(pw);
    if (!/[#?/@:\s]/.test(pw)) return url; // already safe / encoded
  } catch {
    /* raw "%" in the password -> encode below */
  }
  return `${m[1]}${encodeURIComponent(pw)}@${m[3]}`;
}
