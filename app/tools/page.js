import Link from "next/link";
import { Search } from "lucide-react";
import ToolCard from "../../components/ToolCard";
import { categories, tools } from "../../data/tools";
import { pageMetadata } from "../../lib/metadata";

export const metadata = pageMetadata({ title: "All Tools", description: "Browse ToolNest's working browser-based image, PDF and text tools by category or task.", path: "/tools" });
export default async function ToolsPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.search === "string" ? params.search.trim() : "";
  const matches = query ? tools.filter(tool => `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.toLowerCase())) : tools;
  return <div className="shell simple-page"><span className="eyebrow">The collection</span><h1>All tools</h1><p>Browse the collection by category, or use the search on the home page to find a particular task.</p>{query && <p>Showing results for “{query}”. <Link className="cat-link" href="/tools">Clear search</Link></p>}{matches.length ? <div className="tool-grid">{matches.map(tool=><ToolCard key={tool.slug} tool={tool} />)}</div> : <p>No tools found for “{query}”. Try another search.</p>}<div style={{marginTop:42}}><h2>Browse by category</h2><div className="guides-grid">{categories.map(cat=><Link className="guide-card" href={`/tools/${cat.slug}`} key={cat.slug}><span>{cat.name}</span><h3>{cat.description}</h3><p>{cat.tools.length} tools</p></Link>)}</div></div></div>;
}
