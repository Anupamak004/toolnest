import Link from "next/link";
import Breadcrumbs from "../../components/Breadcrumbs";
import { guides } from "../../data/guides";
import { pageMetadata } from "../../lib/metadata";

export const metadata = pageMetadata({title:"Helpful Guides",description:"Practical guides to image compression, resizing and formats, PDF merging, JPG-to-PNG conversion, readable JSON and clear writing.",path:"/guides"});
export default function GuidesPage(){return <div className="shell simple-page"><Breadcrumbs currentPath="/guides" items={[{label:"Home",href:"/"},{label:"Helpful guides"}]} /><span className="eyebrow">A little know-how</span><h1>Helpful guides</h1><p>Clear explanations, examples and realistic limitations for image, PDF, JSON and writing tasks.</p><div className="guides-grid">{guides.map(guide=><Link className="guide-card" href={`/guides/${guide.slug}`} key={guide.slug}><span>{guide.tag}</span><h2>{guide.title}</h2><p>{guide.description}</p></Link>)}</div></div>}
