import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "../../components/Breadcrumbs";
import CopyEmailButton from "../../components/CopyEmailButton";
import { infoPages } from "../../data/guides";
import { pageMetadata } from "../../lib/metadata";

export const dynamicParams = false;
export function generateStaticParams(){return Object.keys(infoPages).map(page=>({page}));}
export async function generateMetadata({params}){const {page}=await params;const item=infoPages[page];return item?pageMetadata({title:item.title,description:item.description,path:`/${page}`}):{};}
export default async function InfoPage({params}){const {page}=await params;const content=infoPages[page];if(!content)notFound();return <article className="shell simple-page info-page"><Breadcrumbs currentPath={`/${page}`} items={[{label:"Home",href:"/"},{label:content.title}]} /><span className="eyebrow">ToolNest</span><h1>{content.title}</h1><p className="info-intro">{content.description}</p>{content.notice&&<p className="info-notice" role="note">{content.notice}</p>}{content.email&&<div className="contact-email-card"><a className="contact-email" href={`mailto:${content.email}`}>{content.email}</a><CopyEmailButton email={content.email} /></div>}<div className="info-content">{content.sections.map(([heading,body])=><section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}{content.allToolsLink&&<section><h2>Explore the tools</h2><p><Link href="/tools">Browse all ToolNest tools</Link></p></section>}{content.contactEmail&&<section><h2>Privacy enquiries</h2><p>Email <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a> or see the <a href="/contact">Contact page</a>.</p></section>}{content.resources?.length>0&&<section><h2>More privacy information</h2><ul className="privacy-resource-list">{content.resources.map(([label,href])=><li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul></section>}</div></article>}
