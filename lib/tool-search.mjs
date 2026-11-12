export function filterTools(tools, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return tools;
  return tools.filter(tool => `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalizedQuery));
}
