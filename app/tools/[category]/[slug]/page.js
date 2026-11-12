import { notFound } from "next/navigation";
import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { categories, getCategory, getTool } from "../../../../data/tools";
import { getToolContent } from "../../../../data/tool-content";
import { pageMetadata } from "../../../../lib/metadata";

export function generateStaticParams() {
  return categories.flatMap(category => category.tools.map(slug => ({ category: category.slug, slug })));
}

export async function generateMetadata({ params }) {
  const { slug, category: categorySlug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.category !== categorySlug) return {};
  const content = getToolContent(slug);
  return pageMetadata({title:tool.name,description:content.intro,path:`/tools/${categorySlug}/${slug}`});
}

export default async function ToolPage({ params }) {
  const { slug, category: categorySlug } = await params;
  const tool = getTool(slug);
  const category = getCategory(categorySlug);
  if (!tool || !category || tool.category !== categorySlug) notFound();
  const clientTool = { slug: tool.slug, name: tool.name, description: tool.description, category: tool.category };
  const clientCategory = { slug: category.slug, name: category.name };
  return <ToolWorkspace tool={clientTool} category={clientCategory} />;
}
