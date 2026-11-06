/** "2026-1001", "sc-2026-1001", "SC-2026-1001" -> "SC-2026-1001" */
export const normalizeStudentId = (raw: string) => {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  return v.startsWith("SC-") ? v : `SC-${v}`;
};

export const normalizePhone = (raw: string) => raw.replace(/[\s-]/g, "").replace(/^\+?88/, "");

/** Random 6 digit guardian PIN */
export const newPin = () => String(Math.floor(100000 + Math.random() * 900000));

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Stable gradient class for an avatar based on a string */
export const avatarTone = (key: string) => `g${(Array.from(key).reduce((a, c) => a + c.charCodeAt(0), 0) % 6) + 1}`;
