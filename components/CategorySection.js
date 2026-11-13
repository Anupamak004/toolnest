import Link from "next/link";
import ToolCard from "./ToolCard";
import { getCategoryBrowseLabel } from "../lib/category-label.mjs";

export default function CategorySection({ category, tools, id, showToolAnchors = false }) {
  const Icon = category.icon;
  return <section className="category-block" id={id || category.slug}>
    <div className="category-intro"><div className="category-title-line"><span className="icon-tile"><Icon size={20} aria-hidden="true" /></span><div><h2>{category.name}</h2><p className="section-note">{category.description}</p></div></div>
      <Link className="cat-link" href={`/tools/${category.slug}`}>{getCategoryBrowseLabel(category.name)} <span aria-hidden="true">→</span></Link></div>
    <div className="tool-grid">{tools.map(tool => <ToolCard key={tool.slug} tool={tool} showAnchor={showToolAnchors} />)}</div>
  </section>;
}
