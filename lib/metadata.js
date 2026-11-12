import { canonicalUrl } from "./site-url.mjs";

export function pageMetadata({ title, description, path, type = "website" }) {
  const url = canonicalUrl(path);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url, siteName: "ToolNest", type, locale: "en_US" },
  };
}
