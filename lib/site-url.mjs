export function getSiteUrl(env = process.env) {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured && env.NODE_ENV === "production") {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to the production HTTPS origin before building ToolNest.");
  }
  const raw = configured || "http://localhost:3000";
  let url;
  try { url = new URL(raw); } catch { throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
  }
  return url.origin;
}

export function canonicalUrl(path, env = process.env) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${getSiteUrl(env)}/`).toString();
}
