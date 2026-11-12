"use client";

import Link from "next/link";
import { AlignLeft, CaseSensitive, Crop, FileImage, FilePlus2, FileText, Image, ListX, RotateCw, Type, FileOutput } from "lucide-react";
import ImageTools from "./ImageTools";
import PdfTools from "./PdfTools";
import TextTools from "./TextTools";
import Breadcrumbs from "../Breadcrumbs";
import { getToolContent } from "../../data/tool-content";
import { getTool } from "../../data/tools";

const toolIcons = { "image-compressor":FileImage, "image-resizer":Crop, "jpg-to-png":Image, "png-to-jpg":Image, "image-to-pdf":FileText, "merge-pdf":FilePlus2, "split-pdf":FileOutput, "rotate-pdf":RotateCw, "pdf-to-images":FileImage, "word-counter":AlignLeft, "case-converter":CaseSensitive, "remove-duplicate-lines":ListX };

export default function ToolWorkspace({ tool, category }) {
  const Icon = toolIcons[tool.slug] || Type;
  const content = getToolContent(tool.slug);
  return <div className="shell tool-page">
    <Breadcrumbs currentPath={`/tools/${category.slug}/${tool.slug}`} items={[{label:"Home",href:"/"},{label:"All tools",href:"/tools"},{label:category.name,href:`/tools/${category.slug}`},{label:tool.name}]} />
    <div className="tool-page-heading"><span className="icon-tile"><Icon size={21} aria-hidden="true" /></span><div><span className="eyebrow">{category.name}</span><h1>{tool.name}</h1><p>{tool.description}</p></div></div>
    <p className="privacy-note">Selected files and text stay in this browser; the tools do not upload them.</p>
    <section className="tool-workspace" aria-label={`${tool.name} workspace`}>
      {tool.category === "image" && <ImageTools slug={tool.slug} />}
      {tool.category === "pdf" && <PdfTools slug={tool.slug} />}
      {tool.category === "text" && <TextTools slug={tool.slug} />}
    </section>
    {content && <article className="tool-article">
      <section><h2>About this tool</h2><p>{content.intro}</p></section>
      <section><h2>How to use it</h2><ol>{content.steps.map(step=><li key={step}>{step}</li>)}</ol></section>
      <section><h2>Supported formats and limits</h2><p>{content.formats}</p></section>
      <section><h2>When it helps</h2><p>{content.uses}</p></section>
      <section><h2>Frequently asked questions</h2>{content.faqs.map(([question,answer])=><div className="tool-faq" key={question}><h3>{question}</h3><p>{answer}</p></div>)}</section>
      <section><h2>Related tools</h2><ul className="related-tools">{content.related.map(slug=>{const related=getTool(slug);return related&&<li key={slug}><Link href={`/tools/${related.category}/${slug}`}>{related.name} →</Link></li>;})}</ul></section>
      {content.guide&&<section><h2>Related guide</h2><p><Link href={content.guide[0]}>{content.guide[1]} →</Link></p></section>}
      {content.relatedGuides?.length>0&&<section><h2>Related guides</h2><ul className="related-tools">{content.relatedGuides.map(([href,label])=><li key={href}><Link href={href}>{label} →</Link></li>)}</ul></section>}
    </article>}
    <Link className="back-link" href={`/tools/${category.slug}`}>← All {category.name.toLowerCase()}</Link>
  </div>;
}
