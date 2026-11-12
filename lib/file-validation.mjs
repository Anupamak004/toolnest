export const IMAGE_LIMIT_BYTES = 20 * 1024 * 1024;
export const PDF_LIMIT_BYTES = 50 * 1024 * 1024;
export const MERGE_TOTAL_LIMIT_BYTES = 100 * 1024 * 1024;
export const IMAGE_TO_PDF_TOTAL_LIMIT_BYTES = 60 * 1024 * 1024;
export const IMAGE_TO_PDF_MAX_FILES = 50;
export const MAX_IMAGE_DIMENSION = 10000;
export const MAX_IMAGE_PIXELS = 40000000;
export const MAX_PDF_PAGES = 200;

const imageTypeByExtension = new Map([["jpg", "jpeg"], ["jpeg", "jpeg"], ["png", "png"], ["webp", "webp"]]);
const imageTypeByMime = new Map([["image/jpeg", "jpeg"], ["image/png", "png"], ["image/webp", "webp"]]);
const imageExtensionByMime = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

function getImageFormatFromName(name) {
  const extension = String(name || "").split(".").pop()?.toLowerCase();
  return imageTypeByExtension.get(extension) || null;
}

export function getImageFormat(file) {
  const mime = String(file?.type || "").toLowerCase();
  return imageTypeByMime.get(mime) || getImageFormatFromName(file?.name);
}

export function getImageExtensionFromMime(mime) {
  return imageExtensionByMime.get(String(mime || "").toLowerCase()) || null;
}

export function validateImageFile(file, { maxBytes = IMAGE_LIMIT_BYTES, formats = ["jpeg", "png", "webp"] } = {}) {
  if (!file || typeof file.size !== "number") throw new Error("Choose an image file to continue.");
  const format = getImageFormat(file);
  if (!format || !formats.includes(format)) throw new Error(`Choose a supported ${formats.map(f => f.toUpperCase()).join(", ")} image.`);
  if (file.size <= 0) throw new Error("The selected image is empty.");
  if (file.size > maxBytes) throw new Error(`This image is larger than the ${formatBytes(maxBytes)} per-file limit.`);
  return format;
}

export async function validateImageFileContent(file, options = {}) {
  const declared = validateImageFile(file, options);
  const declaredMime = imageTypeByMime.get(String(file.type || "").toLowerCase()) || null;
  const declaredName = getImageFormatFromName(file.name);
  if (declaredMime && declaredName && declaredMime !== declaredName) {
    throw new Error(`The selected file name indicates ${declaredName.toUpperCase()}, but its MIME type indicates ${declaredMime.toUpperCase()}. Choose a file with matching type and extension.`);
  }
  if (typeof file.slice !== "function") throw new Error("This browser could not inspect the selected image file.");
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  let actual = null;
  if (header.length >= 8 && [137,80,78,71,13,10,26,10].every((byte,index)=>header[index]===byte)) actual = "png";
  else if (header.length >= 3 && header[0]===0xff && header[1]===0xd8 && header[2]===0xff) actual = "jpeg";
  else if (header.length >= 12 && String.fromCharCode(...header.slice(0,4))==="RIFF" && String.fromCharCode(...header.slice(8,12))==="WEBP") actual = "webp";
  if (!actual) throw new Error("The file contents are not a supported JPEG, PNG or WebP image. Check that the file is valid and not just renamed.");
  if (actual !== declared) throw new Error(`This file contains ${actual.toUpperCase()} image data, but its name or MIME type indicates ${declared.toUpperCase()}. Choose the original file or correct its extension.`);
  if (!(options.formats || ["jpeg","png","webp"]).includes(actual)) throw new Error(`Choose a ${options.formats.map(format=>format.toUpperCase()).join(" or ")} image.`);
  return actual;
}

export function validatePdfFile(file, { maxBytes = PDF_LIMIT_BYTES } = {}) {
  if (!file || typeof file.size !== "number") throw new Error("Choose a PDF file to continue.");
  const isPdf = String(file.type || "").toLowerCase() === "application/pdf" || String(file.name || "").toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Choose a PDF file (.pdf).");
  if (file.size <= 0) throw new Error("The selected PDF is empty.");
  if (file.size > maxBytes) throw new Error(`This PDF is larger than the ${formatBytes(maxBytes)} per-file limit.`);
  return true;
}

export function validateImageDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error("Width and height must be positive whole numbers.");
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) throw new Error(`Image dimensions cannot exceed ${MAX_IMAGE_DIMENSION} pixels on either side.`);
  if (width * height > MAX_IMAGE_PIXELS) throw new Error(`The output is too large. Keep it below ${formatNumber(MAX_IMAGE_PIXELS)} pixels total.`);
  return { width, height };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === "GB") return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${unit}`;
    value /= 1024;
  }
}

export function formatNumber(number) { return new Intl.NumberFormat("en-US").format(number); }
