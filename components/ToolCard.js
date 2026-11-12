import Link from "next/link";

export default function ToolCard({ tool, showAnchor = false }) {
  const Icon = tool.icon;
  return <Link className="tool-card" id={showAnchor ? tool.slug : undefined} href={`/tools/${tool.category}/${tool.slug}`} aria-label={`${tool.name}: ${tool.description}`}>
    <span className="icon-tile"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
    <h3>{tool.name}</h3><p>{tool.description}</p>
  </Link>;
}
