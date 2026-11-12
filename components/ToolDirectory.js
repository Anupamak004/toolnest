"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ToolCard from "./ToolCard";
import { categories, tools } from "../data/tools";
import { filterTools } from "../lib/tool-search.mjs";

export default function ToolDirectory({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const matches = useMemo(() => filterTools(tools, query), [query]);

  return <>
    <div className="directory-search">
      <label className="search-box" htmlFor="tool-directory-search">
        <Search size={19} aria-hidden="true" />
        <span className="sr-only">Search all tools</span>
        <input id="tool-directory-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by tool or task…" aria-describedby="directory-result-count" />
      </label>
    </div>
    <p className="directory-result-count" id="directory-result-count" aria-live="polite">{query.trim() ? `${matches.length} of ${tools.length} tools match “${query.trim()}”` : `${tools.length} tools`}</p>
    {matches.length ? <div className="tool-grid">{matches.map(tool => <ToolCard key={tool.slug} tool={tool} />)}</div> : <div className="directory-empty"><h2>No tools match “{query.trim()}”</h2><p>Try a different word or browse a category below.</p></div>}
    <div className="directory-categories"><h2>Browse by category</h2><div className="guides-grid">{categories.map(category=><Link className="guide-card" href={`/tools/${category.slug}`} key={category.slug}><span>{category.name}</span><h3>{category.description}</h3><p>{category.tools.length} tools</p></Link>)}</div></div>
  </>;
}
