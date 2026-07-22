/** Client-safe copy of the admin email (must match server default). */
export const ADMIN_EMAIL = "demo@smartshop.dev";

export function isAdminEmailClient(email: string | undefined | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}
