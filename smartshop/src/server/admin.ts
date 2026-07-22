import "server-only";

/** Only this account can open /admin and export experiment data. */
export const ADMIN_EMAIL = "demo@smartshop.dev";

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? ADMIN_EMAIL)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
