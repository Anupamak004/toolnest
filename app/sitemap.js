import { categories, tools } from "../data/tools";
import { guides, infoPages } from "../data/guides";
import { canonicalUrl } from "../lib/site-url.mjs";
import { getPublicPaths } from "../lib/public-routes.mjs";

export default function sitemap() {
  return getPublicPaths({categories,tools,guides,infoPages}).map(path=>({url:canonicalUrl(path)}));
}
