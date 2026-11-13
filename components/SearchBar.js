"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { tools, categories } from "../data/tools";
import { filterTools } from "../lib/tool-search.mjs";
import { getNextSearchOptionIndex, getSearchComboboxProps } from "../lib/search-accessibility.mjs";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef(null);
  const matches = useMemo(() => query.trim() ? filterTools(tools, query).slice(0, 5) : [], [query]);
  useEffect(() => { const onKeyDown = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inputRef.current?.focus(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);
  return <div className="search-wrap">
    <label className="search-box"><Search size={19} aria-hidden="true" /><span className="sr-only">Search tools</span><input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }} onKeyDown={e => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (matches.length) {
          e.preventDefault();
          setActiveIndex(current => getNextSearchOptionIndex(current, e.key, matches.length));
        }
      } else if (e.key === "Enter" && matches.length) {
        e.preventDefault();
        const selected = matches[activeIndex >= 0 ? activeIndex : 0];
        router.push(`/tools/${selected.category}/${selected.slug}`);
        setQuery("");
        setActiveIndex(-1);
      } else if (e.key === "Escape") {
        setQuery("");
        setActiveIndex(-1);
      }
    }} placeholder="What would you like to do?" aria-label="Search tools" {...getSearchComboboxProps({ hasOptions: matches.length > 0, activeOptionId: matches[activeIndex] ? `tool-option-${matches[activeIndex].slug}` : undefined })} /><kbd className="search-shortcut">Ctrl K</kbd></label>
    <div className="search-results" id="tool-search-results" role="listbox" aria-label="Tool suggestions" hidden={matches.length === 0}>{matches.map((tool, index) => { const category = categories.find(item => item.slug === tool.category); const Icon = tool.icon; return <Link key={tool.slug} id={`tool-option-${tool.slug}`} className="search-result" role="option" aria-selected={index === activeIndex} tabIndex={-1} href={`/tools/${tool.category}/${tool.slug}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => { setQuery(""); setActiveIndex(-1); }}><span className="icon-tile"><Icon size={16} aria-hidden="true" /></span><span><strong>{tool.name}</strong><small>{category.name} · {tool.description}</small></span></Link>; })}</div>
    {query && matches.length === 0 && <div className="search-results search-status" role="status">No tools match “{query}”. Try another search.</div>}
  </div>;
}
