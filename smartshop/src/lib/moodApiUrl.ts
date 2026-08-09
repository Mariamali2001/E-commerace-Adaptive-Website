/** Normalize MOOD_API_URL so host-only Railway values still work. */
export function resolveMoodApiUrl(): string {
  let url = (process.env.MOOD_API_URL ?? "http://127.0.0.1:8001").trim();
  url = url.replace(/\/$/, "");
  if (!url) return "http://127.0.0.1:8001";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}
