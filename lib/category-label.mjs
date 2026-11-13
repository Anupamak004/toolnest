export function getCategoryBrowseLabel(categoryName) {
  const category = categoryName.replace(/\s+tools?$/i, "").toLowerCase();
  const label = category === "pdf" ? "PDF" : category;
  return `Browse ${label} tools`;
}
