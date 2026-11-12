import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import SearchBar from "../components/SearchBar";
import CategorySection from "../components/CategorySection";
import ToolCard from "../components/ToolCard";
import { categories, tools } from "../data/tools";

const popularSlugs = ["image-compressor", "merge-pdf", "word-counter", "pdf-to-images"];
const recentSlugs = ["png-to-jpg", "split-pdf", "remove-duplicate-lines"];
const guides = [
  { href:"/guides/compress-images-without-losing-quality", label:"Images", title:"How to Compress Images Without Losing Too Much Quality", text:"Compare output sizes and visual detail without expecting a guaranteed reduction." },
  { href:"/guides/resize-images-online", label:"Images", title:"How to Resize Images Online", text:"Choose practical dimensions and preserve proportions when you need them." },
  { href:"/guides/merge-pdf-files", label:"PDF", title:"How to Merge PDF Files", text:"Put documents in order and review the combined result." },
];

export default function HomePage() {
  const popular = popularSlugs.map(slug => tools.find(tool => tool.slug === slug));
const recent = recentSlugs.map(slug => tools.find(tool => tool.slug === slug));
  return <>
    <section className="hero"><div className="shell"><div className="hero-kicker"><Sparkles size={14} aria-hidden="true" /> A little less busywork</div><h1>Free tools for<br /><span>everything you do.</span></h1><p className="hero-copy">A practical collection of image, PDF and text tools that work right in your browser. Your selected files stay on your device.</p><SearchBar /><div className="popular-tags"><span>Explore:</span>{[["Resize an image","/tools/image/image-resizer"],["Merge PDFs","/tools/pdf/merge-pdf"],["Count words","/tools/text/word-counter"],["Convert JPG to PNG","/tools/image/jpg-to-png"]].map(([name,href])=><Link key={name} href={href}>{name}</Link>)}</div></div></section>
    <section className="section-pad"><div className="shell"><div className="section-heading"><div><span className="eyebrow">A good place to start</span><h2 className="section-title">Popular tools</h2><p className="section-note">A few common tasks, easy to find.</p></div><Link href="/tools" className="cat-link">Browse all tools <ArrowRight size={14} style={{verticalAlign:"middle"}} /></Link></div><div className="tool-grid">{popular.map(tool=><ToolCard key={tool.slug} tool={tool} />)}</div></div></section>
    <section className="soft-section"><div className="shell">{categories.map(category=><CategorySection key={category.slug} category={category} tools={category.tools.map(slug=>tools.find(tool=>tool.slug===slug))} />)}</div></section>
    <section className="section-pad"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Fresh from the nest</span><h2 className="section-title">Recently added</h2><p className="section-note">Recent additions to the catalog.</p></div><Link href="/tools" className="cat-link">See the full collection <ArrowRight size={14} style={{verticalAlign:"middle"}} /></Link></div><div className="tool-grid">{recent.map(tool=><ToolCard key={tool.slug} tool={tool} />)}</div></div></section>
    <section className="soft-section section-pad"><div className="shell"><div className="section-heading"><div><span className="eyebrow">A little know-how</span><h2 className="section-title">Helpful guides</h2><p className="section-note">Clear notes for making everyday digital work a little easier.</p></div><Link href="/guides" className="cat-link">All guides <ArrowRight size={14} style={{verticalAlign:"middle"}} /></Link></div><div className="guides-grid">{guides.map(guide=><Link key={guide.href} className="guide-card" href={guide.href}><span>{guide.label}</span><h3>{guide.title}</h3><p>{guide.text}</p><span className="guide-more">Read guide <ArrowRight size={13} style={{verticalAlign:"middle"}} /></span></Link>)}</div></div></section>
  </>;
}
