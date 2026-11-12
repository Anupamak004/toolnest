"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { categories } from "../data/tools";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return <header className="site-header"><div className="shell header-inner">
    <Link href="/" className="brand" aria-label="ToolNest home"><span className="brand-mark"><Sparkles size={17} strokeWidth={2.2} aria-hidden="true" /></span>Toolnest</Link>
    <nav id="primary-navigation" className={`nav-links${open ? " is-open" : ""}`} aria-label="Tool categories">{categories.map(category => <Link key={category.slug} href={`/tools/${category.slug}`} onClick={() => setOpen(false)}>{category.name.replace(" Tools", "")}</Link>)}<Link className="nav-all-tools" href="/tools" onClick={() => setOpen(false)}>All tools</Link></nav>
    <Link href="/tools" className="header-cta">Explore all tools <span aria-hidden="true">↗</span></Link>
    <button ref={menuButton} type="button" className="mobile-trigger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
  </div></header>;
}
