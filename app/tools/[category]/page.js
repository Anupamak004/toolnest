import { notFound } from "next/navigation";
import CategorySection from "../../../components/CategorySection";
import { categories, tools, getCategory } from "../../../data/tools";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { pageMetadata } from "../../../lib/metadata";

export function generateStaticParams() { return categories.map(({slug})=>({category:slug})); }
export async function generateMetadata({params}) { const {category:slug}=await params; const category=getCategory(slug); return category ? pageMetadata({title:category.name,description:`Browse working ${category.name.toLowerCase()} for common tasks. ${category.description}`,path:`/tools/${slug}`}) : {}; }
export default async function CategoryPage({params}) {
  const {category:slug}=await params; const category=getCategory(slug); if(!category) notFound();
  return <div className="shell simple-page"><Breadcrumbs currentPath={`/tools/${category.slug}`} items={[{label:"Home",href:"/"},{label:"All tools",href:"/tools"},{label:category.name}]} /><span className="eyebrow">Tool collection</span><h1>{category.name}</h1><p>{category.description} Files stay on your device while these tools process them.</p><CategorySection category={category} tools={category.tools.map(slug=>tools.find(tool=>tool.slug===slug))} id={category.slug} showToolAnchors /></div>;
}
