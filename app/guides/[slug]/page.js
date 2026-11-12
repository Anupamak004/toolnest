import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { guides, getGuide } from "../../../data/guides";
import { pageMetadata } from "../../../lib/metadata";

export function generateStaticParams() { return guides.map(({slug})=>({slug})); }
export async function generateMetadata({params}) {
  const {slug}=await params; const guide=getGuide(slug);
  return guide ? pageMetadata({title:guide.title,description:guide.description,path:`/guides/${slug}`,type:"article"}) : {};
}
export default async function GuidePage({params}) {
  const {slug}=await params; const guide=getGuide(slug); if(!guide)notFound();
  return <article className="shell simple-page guide-page">
    <Breadcrumbs currentPath={`/guides/${slug}`} items={[{label:"Home",href:"/"},{label:"Helpful guides",href:"/guides"},{label:guide.title}]} />
    <span className="eyebrow">{guide.tag}</span><h1>{guide.title}</h1><p className="guide-intro">{guide.intro}</p>
    <div className="guide-body">{guide.steps ? <><h2>Steps to follow</h2><ol>{guide.steps.map(([title,body],index)=><li key={title}><h3>{index+1}. {title}</h3><p>{body}</p></li>)}</ol>
      <section><h2>Example</h2><p>{guide.example}</p></section><section><h2>Limits to keep in mind</h2><p>{guide.limitations}</p></section></> : guide.sections.map(([title,body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}
      {guide.tool && <section className="guide-tool-link"><h2>Try the related tool</h2><p>Use ToolNest to complete this task in your browser.</p><Link className="cat-link" href={guide.tool[0]}>{guide.tool[1]} →</Link></section>}
    </div>
  </article>;
}
