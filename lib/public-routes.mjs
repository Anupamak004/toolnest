export function getPublicPaths({ categories, tools, guides, infoPages }) {
  return [
    "/", "/tools", ...categories.map(category=>`/tools/${category.slug}`),
    ...tools.map(tool=>`/tools/${tool.category}/${tool.slug}`),
    "/guides", ...guides.map(guide=>`/guides/${guide.slug}`),
    ...Object.keys(infoPages).map(page=>`/${page}`),
  ];
}
