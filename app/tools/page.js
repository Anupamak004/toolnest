import ToolDirectory from "../../components/ToolDirectory";
import { pageMetadata } from "../../lib/metadata";

export const metadata = pageMetadata({ title: "All Tools", description: "Browse ToolNest's working browser-based image, PDF and text tools by category or task.", path: "/tools" });
export default async function ToolsPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.search === "string" ? params.search.trim() : "";
  return <div className="shell simple-page"><span className="eyebrow">The collection</span><h1>All tools</h1><p>Search by tool name or task, or browse the collection by category.</p><ToolDirectory initialQuery={query} /></div>;
}
