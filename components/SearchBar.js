"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { tools, categories } from "../data/tools";
import { filterTools } from "../lib/tool-search.mjs";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const matches = useMemo(() => query.trim() ? filterTools(tools, query).slice(0, 5) : [], [query]);
  useEffect(() => { const onKeyDown = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inputRef.current?.focus(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);
  return <div className="search-wrap">
    <label className="search-box"><Search size={19} aria-hidden="true" /><span className="sr-only">Search tools</span><input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setQuery(""); }} placeholder="What would you like to do?" aria-label="Search tools" aria-autocomplete="list" aria-expanded={matches.length > 0} aria-controls="tool-search-results" /><kbd className="search-shortcut">Ctrl K</kbd></label>
    {matches.length > 0 && <div className="search-results" id="tool-search-results" role="listbox">{matches.map(tool => { const category = categories.find(item => item.slug === tool.category); const Icon = tool.icon; return <Link key={tool.slug} className="search-result" role="option" href={`/tools/${tool.category}/${tool.slug}`} onClick={() => setQuery("")}><span className="icon-tile"><Icon size={16} aria-hidden="true" /></span><span><strong>{tool.name}</strong><small>{category.name} · {tool.description}</small></span></Link>; })}</div>}
    {query && matches.length === 0 && <div className="search-results" role="status" style={{padding:"16px",color:"#63748a",fontSize:13}}>No tools match “{query}”. Try another search.</div>}
  </div>;
}
