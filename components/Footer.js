import Link from "next/link";
import { Sparkles } from "lucide-react";
import { categories } from "../data/tools";

export default function Footer() {
  return <footer className="site-footer"><div className="shell footer-top">
    <div><Link href="/" className="brand" aria-label="ToolNest home"><span className="brand-mark"><Sparkles size={16} aria-hidden="true" /></span>toolnest</Link><p className="footer-about">Free browser-based tools for everyday image, PDF and text tasks.</p></div>
    <div><h2 className="footer-heading">Explore</h2><nav className="footer-links" aria-label="Tool categories">{categories.map(category=><Link key={category.slug} href={`/tools/${category.slug}`}>{category.name}</Link>)}</nav></div>
    <div><h2 className="footer-heading">ToolNest</h2><nav className="footer-links" aria-label="About ToolNest"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/guides">Helpful guides</Link></nav></div>
    <div><h2 className="footer-heading">Legal</h2><nav className="footer-links" aria-label="Legal information"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/disclaimer">Disclaimer</Link></nav></div>
  </div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} ToolNest. Made for useful little moments.</span><span>Simple tools, thoughtfully gathered.</span></div></footer>;
}
