import Link from "next/link";
import Breadcrumbs from "../../components/Breadcrumbs";
import { guides } from "../../data/guides";
import { pageMetadata } from "../../lib/metadata";

export const metadata = pageMetadata({title:"Helpful Guides",description:"Practical, concise guides for compressing and resizing images, merging PDFs and converting image formats.",path:"/guides"});
export default function GuidesPage(){return <div className="shell simple-page"><Breadcrumbs currentPath="/guides" items={[{label:"Home",href:"/"},{label:"Helpful guides"}]} /><span className="eyebrow">A little know-how</span><h1>Helpful guides</h1><p>Clear steps, realistic limitations and examples for common image and PDF tasks.</p><div className="guides-grid">{guides.map(guide=><Link className="guide-card" href={`/guides/${guide.slug}`} key={guide.slug}><span>{guide.tag}</span><h2>{guide.title}</h2><p>{guide.description}</p></Link>)}</div></div>}
