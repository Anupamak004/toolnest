import Link from "next/link";
import { canonicalUrl } from "../lib/site-url.mjs";

export default function Breadcrumbs({ items, currentPath }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.label,
      ...((item.href || (index === items.length - 1 && currentPath)) ? { item: canonicalUrl(item.href || currentPath) } : {}),
    })),
  };
  return <>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>
      {index > 0 && <span aria-hidden="true">/</span>}
      {item.href && index !== items.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
    </li>)}</ol></nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </>;
}
