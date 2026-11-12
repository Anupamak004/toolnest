import { Image, FileText, Type, Crop, FileImage, FilePlus2, FileOutput, RotateCw, AlignLeft, CaseSensitive, ListX } from "lucide-react";

export const categories = [
  { slug: "image", name: "Image Tools", icon: Image, description: "Resize, convert, compress and prepare images locally in your browser.", tools: ["image-compressor", "image-resizer", "jpg-to-png", "png-to-jpg", "image-to-pdf"] },
  { slug: "pdf", name: "PDF Tools", icon: FileText, description: "Merge, split, rotate and render PDF files on your device.", tools: ["merge-pdf", "split-pdf", "rotate-pdf", "pdf-to-images"] },
  { slug: "text", name: "Text Tools", icon: Type, description: "Small, useful helpers for writing and editing.", tools: ["word-counter", "case-converter", "remove-duplicate-lines"] },
];

const definitions = [
  ["image-compressor", "Image Compressor", "Compress JPEG, PNG and WebP images in your browser.", FileImage, "image"],
  ["image-resizer", "Image Resizer", "Resize JPEG, PNG and WebP images with optional aspect lock.", Crop, "image"],
  ["jpg-to-png", "JPG to PNG", "Convert JPEG image data to a downloadable PNG.", Image, "image"],
  ["png-to-jpg", "PNG to JPG", "Convert PNG images with a selectable background color.", Image, "image"],
  ["image-to-pdf", "Image to PDF", "Arrange one or more images into a downloadable PDF.", FileText, "image"],
  ["merge-pdf", "Merge PDF", "Combine PDFs in your chosen file order.", FilePlus2, "pdf"],
  ["split-pdf", "Split PDF", "Extract page ranges or individual pages into PDFs.", FileOutput, "pdf"],
  ["rotate-pdf", "Rotate PDF", "Rotate selected pages by 90, 180 or 270 degrees.", RotateCw, "pdf"],
  ["pdf-to-images", "PDF to Images", "Preview PDF pages and export them as PNG or JPEG.", FileImage, "pdf"],
  ["word-counter", "Word Counter", "Count words, characters, sentences and paragraphs as you type.", AlignLeft, "text"],
  ["case-converter", "Case Converter", "Convert text to uppercase, lowercase, title or sentence case.", CaseSensitive, "text"],
  ["remove-duplicate-lines", "Remove Duplicate Lines", "Keep the first matching line and remove later duplicates.", ListX, "text"],
];

export const tools = definitions.map(([slug, name, description, icon, category]) => ({ slug, name, description, icon, category }));
export const getCategory = slug => categories.find(category => category.slug === slug);
export const getTool = slug => tools.find(tool => tool.slug === slug);
