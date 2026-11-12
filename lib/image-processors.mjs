import { validateImageDimensions } from "./file-validation.mjs";

export async function processBitmap(bitmap, { width = bitmap.width, height = bitmap.height, mimeType = "image/png", quality, background = null } = {}, adapters = {}) {
  validateImageDimensions(width, height);
  const createCanvas = adapters.createCanvas || ((w, h) => { const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h; return canvas; });
  const canvas=createCanvas(width,height);
  const context=canvas.getContext("2d",{alpha:true});
  if(!context) throw new Error("Your browser could not create an image canvas.");
  if(background) { context.fillStyle=background; context.fillRect(0,0,width,height); }
  context.drawImage(bitmap,0,0,width,height);
  const blob=adapters.encode
    ? await adapters.encode(canvas,mimeType,quality)
    : await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error("Your browser could not export this image format.")),mimeType,quality));
  if(!blob) throw new Error("Image processing did not produce an output file.");
  return { blob, width, height, mimeType: blob.type || mimeType };
}

export async function processBitmapAtQualities(bitmap, options, qualities, adapters = {}) {
  const candidates = [...new Set((qualities || []).map(value => Math.max(0, Math.min(1, Number(value)))))];
  if (!candidates.length || candidates.some(value => !Number.isFinite(value))) throw new Error("At least one valid image quality is required.");
  const encoded = [];
  for (const quality of candidates) {
    const result = await processBitmap(bitmap, { ...options, quality }, adapters);
    if (result.mimeType !== options.mimeType) throw new Error(`This browser cannot export ${options.mimeType.replace("image/", "").toUpperCase()} without changing the image format. The original file was left unchanged.`);
    encoded.push({ ...result, quality });
  }
  encoded.sort((a,b)=>a.blob.size-b.blob.size || b.quality-a.quality);
  const smallest=encoded[0];
  return { ...smallest, encodings: encoded.map(({quality,blob})=>({quality,bytes:blob.size})) };
}

export const COMPRESSION_QUALITY_PRESETS = [0.75, 0.8, 0.85, 0.9, 0.95, 1];

export function getCompressionQualities(minimumQuality) {
  const minimum = Number(minimumQuality);
  if (!Number.isFinite(minimum) || minimum < 0.5 || minimum > 1) {
    throw new Error("Choose a quality between 50% and 100%.");
  }
  return [...new Set([minimum, ...COMPRESSION_QUALITY_PRESETS.filter(value => value >= minimum)])].sort((a, b) => a - b);
}

export function getPngOptimizationLevels(level) {
  const selected = Number(level);
  if (!Number.isInteger(selected) || selected < 1 || selected > 4) throw new Error("Choose a PNG optimization level from 1 to 4.");
  return Array.from({ length: 5 - selected }, (_, index) => selected + index);
}

async function bitmapToImageData(bitmap, background = null, adapters = {}) {
  const createCanvas = adapters.createCanvas || ((width, height) => { const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas; });
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!context) throw new Error("Your browser could not prepare the image for encoding.");
  if (background) { context.fillStyle = background; context.fillRect(0, 0, bitmap.width, bitmap.height); }
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

async function encodeImageCandidates(imageData, format, qualities, adapters = {}) {
  if (adapters.encodeCandidates) {
    const result = await adapters.encodeCandidates(imageData, { format, qualities });
    return Array.isArray(result) ? selectSmallestCandidate(result) : result;
  }
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/webp";
  let encoder;
  if (adapters.encode) {
    const bitmap = { width: imageData.width, height: imageData.height };
    const canvas = adapters.createCanvas?.(bitmap.width, bitmap.height);
    const context = canvas?.getContext("2d");
    if (!context) throw new Error("The test image encoder could not create a canvas.");
    context.putImageData(imageData, 0, 0);
    const candidates = [];
    for (const quality of qualities) candidates.push({ blob: await adapters.encode(canvas, mimeType, quality), quality });
    return selectSmallestCandidate(candidates);
  }
  try {
    const module = format === "jpeg" ? await import("@jsquash/jpeg/encode.js") : await import("@jsquash/webp/encode.js");
    encoder = module.default;
  } catch { throw new Error(`The ${format.toUpperCase()} encoder could not be loaded in this browser.`); }
  const candidates = [];
  for (const quality of qualities) {
    const bytes = await encoder(imageData, { quality: Math.round(quality * 100) });
    candidates.push({ blob: new Blob([bytes], { type: mimeType }), quality });
  }
  return selectSmallestCandidate(candidates);
}

function selectSmallestCandidate(candidates) {
  if (!candidates?.length) throw new Error("The image encoder did not return any valid candidates.");
  const ordered = [...candidates].sort((a, b) => a.blob.size - b.blob.size || b.quality - a.quality);
  return { ...ordered[0], encodings: ordered.map(({ quality, blob }) => ({ quality, bytes: blob.size })) };
}

async function optimizePngCandidates(original, levels, width, height, adapters = {}) {
  if (adapters.optimizePng) {
    const result = await adapters.optimizePng(original, { levels, width, height });
    if (!Array.isArray(result)) return result;
    const ordered = [...result].sort((a, b) => a.blob.size - b.blob.size || a.level - b.level);
    return { ...ordered[0], encodings: ordered.map(({ level, blob }) => ({ level, bytes: blob.size })) };
  }
  let optimize;
  try { optimize = (await import("@jsquash/oxipng/optimise.js")).default; }
  catch { throw new Error("The PNG optimizer could not be loaded in this browser."); }
  const source = await original.arrayBuffer();
  const candidates = [];
  for (const level of levels) {
    const bytes = await optimize(source.slice(0), { level, optimiseAlpha: level === 4 });
    candidates.push({ blob: new Blob([bytes], { type: "image/png" }), level });
  }
  const ordered = candidates.sort((a, b) => a.blob.size - b.blob.size || a.level - b.level);
  return { ...ordered[0], encodings: ordered.map(({ level, blob }) => ({ level, bytes: blob.size })) };
}

/** Compress in the detected format, or explicitly convert to another supported format. */
export async function compressImage(bitmap, original, {
  format,
  outputFormat = format,
  minimumQuality = 0.82,
  optimizationLevel = 2,
  background = null,
  adapters = {},
} = {}) {
  if (!original || !Number.isFinite(original.size) || original.size <= 0) {
    throw new Error("The original image file is unavailable or empty.");
  }
  const mimeByFormat = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const mimeType = mimeByFormat[format];
  const outputMime = mimeByFormat[outputFormat];
  if (!mimeType || !outputMime) throw new Error("This image format is not supported.");
  validateImageDimensions(bitmap.width, bitmap.height);

  if (format === "png" && outputFormat === "png") {
    const candidates = await optimizePngCandidates(original, getPngOptimizationLevels(optimizationLevel), bitmap.width, bitmap.height, adapters);
    if (candidates.blob.type !== mimeType) throw new Error("The PNG optimizer returned an invalid file. The original was left unchanged.");
    if (candidates.blob.size >= original.size) return { blob: original, width: bitmap.width, height: bitmap.height, mimeType, format, qualityUsed: null, optimizationLevel: null, originalRetained: true, converted: false, encodings: candidates.encodings };
    return { ...candidates, width: bitmap.width, height: bitmap.height, mimeType, format, qualityUsed: null, optimizationLevel: candidates.level, originalRetained: false, converted: false };
  }
  if (outputFormat === "png") {
    const result = await processBitmap(bitmap, { mimeType: outputMime }, adapters);
    if (result.mimeType !== outputMime) throw new Error("This browser could not export PNG images. The original file was left unchanged.");
    return { ...result, format: outputFormat, qualityUsed: null, originalRetained: false, converted: true };
  }

  const qualities = getCompressionQualities(minimumQuality);
  const imageData = await bitmapToImageData(bitmap, outputFormat === "jpeg" ? background : null, adapters);
  const candidates = await encodeImageCandidates(imageData, outputFormat, qualities, adapters);
  if (candidates.blob.type !== outputMime) throw new Error(`The ${outputFormat.toUpperCase()} encoder returned an invalid format. The original was left unchanged.`);
  const converted = outputFormat !== format;
  // In original-format compression mode, never replace the source with a larger or equal encode.
  if (candidates.blob.size >= original.size && !converted) {
    return { blob: original, width: bitmap.width, height: bitmap.height, mimeType, format, qualityUsed: null, originalRetained: true, converted: false, encodings: candidates.encodings };
  }
  return { ...candidates, width: bitmap.width, height: bitmap.height, mimeType: outputMime, format: outputFormat, qualityUsed: candidates.quality ?? null, originalRetained: false, converted };
}

export function calculateSizeReduction(originalBytes, outputBytes) {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0 || !Number.isFinite(outputBytes) || outputBytes < 0) throw new Error("File sizes must be valid byte counts.");
  return ((originalBytes-outputBytes)/originalBytes)*100;
}
