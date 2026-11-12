import { canonicalUrl } from "../lib/site-url.mjs";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
