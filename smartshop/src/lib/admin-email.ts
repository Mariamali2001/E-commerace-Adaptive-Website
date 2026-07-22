/** Client-safe admin email (must match server/admin.ts default). */
export const ADMIN_EMAIL = "demo@smartshop.dev";

export function isAdminEmailClient(email: string | undefined | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
}
