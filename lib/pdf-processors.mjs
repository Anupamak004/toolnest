import { PDFDocument, degrees, PageSizes } from "pdf-lib";
import { MAX_PDF_PAGES, validateImageDimensions } from "./file-validation.mjs";

export async function loadPdf(bytes) {
  try {
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    if (document.getPageCount() < 1) throw new Error("The PDF contains no pages.");
    if (document.getPageCount() > MAX_PDF_PAGES) throw new Error(`This tool supports up to ${MAX_PDF_PAGES} pages per PDF.`);
    return document;
  } catch (error) {
    if (/no pages|supports up to/.test(error.message)) throw error;
    throw new Error("This PDF could not be opened. It may be damaged, encrypted, or unsupported.");
  }
}

export function parsePageGroups(input, pageCount, { allowAll = false } = {}) {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > MAX_PDF_PAGES) throw new Error(`Page count must be between 1 and ${MAX_PDF_PAGES}.`);
  const value = String(input || "").trim();
  if (allowAll && value.toLowerCase() === "all") return [Array.from({ length: pageCount }, (_, i) => i)];
  if (!value) throw new Error("Enter one or more page numbers or ranges, such as 1-3, 5.");
  const tokens = value.split(",");
  if (tokens.some(token => !token.trim())) throw new Error("Separate page numbers and ranges with commas, for example 1-3, 5.");
  const groups=tokens.map(token => {
    const match = token.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match) throw new Error(`“${token.trim()}” is not a valid page number or range.`);
    const start = Number(match[1]); const end = Number(match[2] || match[1]);
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) throw new Error(`Page numbers must be between 1 and ${pageCount}.`);
    if (start > end) throw new Error("In a page range, the first page must come before the last page.");
    return Array.from({ length: end - start + 1 }, (_, index) => start + index - 1);
  });
  const seen=new Set();
  for(const page of groups.flat()) {
    if(seen.has(page)) throw new Error(`Page ${page+1} is listed more than once.`);
    seen.add(page);
  }
  return groups;
}

export async function mergePdfs(fileBytes) {
  if (!Array.isArray(fileBytes) || fileBytes.length < 2) throw new Error("Choose at least two PDF files to merge.");
  const merged = await PDFDocument.create();
  for (const bytes of fileBytes) {
    const source = await loadPdf(bytes);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach(page => merged.addPage(page));
    if (merged.getPageCount() > MAX_PDF_PAGES) throw new Error(`The merged file would exceed the ${MAX_PDF_PAGES}-page limit.`);
  }
  return merged.save();
}

export async function splitPdf(bytes, pageRange) {
  const source = await loadPdf(bytes);
  const groups = parsePageGroups(pageRange, source.getPageCount());
  const outputs = [];
  for (const group of groups) {
    const part = await PDFDocument.create();
    const pages = await part.copyPages(source, group);
    pages.forEach(page => part.addPage(page));
    const label = group.length === 1 ? `page-${group[0] + 1}` : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`;
    outputs.push({ name: `${label}.pdf`, bytes: await part.save(), pages: group.map(index => index + 1) });
  }
  return outputs;
}

export async function rotatePdf(bytes, pageRange, angle) {
  if (![90, 180, 270].includes(Number(angle))) throw new Error("Choose a rotation of 90, 180 or 270 degrees.");
  const document = await loadPdf(bytes);
  const groups = parsePageGroups(pageRange, document.getPageCount(), { allowAll: true });
  const selected = new Set(groups.flat());
  for (const index of selected) {
    const page = document.getPage(index);
    page.setRotation(degrees((page.getRotation().angle + Number(angle)) % 360));
  }
  return document.save();
}

export async function imagesToPdf(images, { pageSize = "a4", orientation = "portrait" } = {}) {
  if (!Array.isArray(images) || images.length < 1) throw new Error("Choose at least one image.");
  if (!["a4", "letter", "fit"].includes(pageSize)) throw new Error("Choose A4, US Letter, or fit-to-image page sizing.");
  if (!["portrait", "landscape"].includes(orientation)) throw new Error("Choose portrait or landscape orientation.");
  const document = await PDFDocument.create();
  for (const item of images) {
    const image = item.type === "jpeg" ? await document.embedJpg(item.bytes) : item.type === "png" ? await document.embedPng(item.bytes) : null;
    if (!image) throw new Error("PDF export supports JPEG and PNG image data.");
    validateImageDimensions(image.width,image.height);
    let pageDimensions = pageSize === "letter" ? [...PageSizes.Letter] : [...PageSizes.A4];
    if (pageSize !== "fit" && orientation === "landscape") pageDimensions.reverse();
    if (pageSize === "fit") pageDimensions = [image.width * .75, image.height * .75];
    const page = document.addPage(pageDimensions);
    const scale = Math.min(pageDimensions[0] / image.width, pageDimensions[1] / image.height);
    const width = image.width * scale; const height = image.height * scale;
    page.drawImage(image, { x: (pageDimensions[0] - width) / 2, y: (pageDimensions[1] - height) / 2, width, height });
  }
  return document.save();
}
