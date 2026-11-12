import { notFound } from "next/navigation";
import Breadcrumbs from "../../components/Breadcrumbs";
import CopyEmailButton from "../../components/CopyEmailButton";
import { infoPages } from "../../data/guides";
import { pageMetadata } from "../../lib/metadata";

export const dynamicParams = false;
export function generateStaticParams(){return Object.keys(infoPages).map(page=>({page}));}
export async function generateMetadata({params}){const {page}=await params;const item=infoPages[page];return item?pageMetadata({title:item.title,description:item.description,path:`/${page}`}):{};}
export default async function InfoPage({params}){const {page}=await params;const content=infoPages[page];if(!content)notFound();return <article className="shell simple-page info-page"><Breadcrumbs currentPath={`/${page}`} items={[{label:"Home",href:"/"},{label:content.title}]} /><span className="eyebrow">ToolNest</span><h1>{content.title}</h1><p className="info-intro">{content.description}</p>{content.notice&&<p className="info-notice" role="note">{content.notice}</p>}{content.email&&<div className="contact-email-card"><a className="contact-email" href={`mailto:${content.email}`}>{content.email}</a><CopyEmailButton email={content.email} /></div>}<div className="info-content">{content.sections.map(([heading,body])=><section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div></article>}
