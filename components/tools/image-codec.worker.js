async function verifyCandidate(buffer, mimeType, width, height) {
  if (typeof createImageBitmap !== "function") return false;
  const image = await createImageBitmap(new Blob([buffer], { type: mimeType }));
  const valid = image.width === width && image.height === height;
  image.close();
  return valid;
}

async function encodeCandidates({ format, pixels, width, height, qualities }) {
  const module = format === "jpeg"
    ? await import("@jsquash/jpeg/encode.js")
    : await import("@jsquash/webp/encode.js");
  const encode = module.default;
  const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/webp";
  let best = null;
  const encodings = [];
  for (const quality of qualities) {
    const buffer = await encode(imageData, { quality: Math.round(quality * 100) });
    const valid = await verifyCandidate(buffer, mimeType, width, height);
    if (!valid) continue;
    encodings.push({ quality, bytes: buffer.byteLength });
    if (!best || buffer.byteLength < best.buffer.byteLength || (buffer.byteLength === best.buffer.byteLength && quality > best.quality)) best = { buffer, quality };
  }
  if (!best) throw new Error(`The ${format.toUpperCase()} encoder could not create a valid image.`);
  return { buffer: best.buffer, quality: best.quality, encodings };
}

async function optimizePng({ bytes, levels, width, height }) {
  const { default: optimize } = await import("@jsquash/oxipng/optimise.js");
  let best = null;
  const encodings = [];
  for (const level of levels) {
    const buffer = await optimize(bytes.slice(0), { level, optimiseAlpha: level === 4 });
    const valid = await verifyCandidate(buffer, "image/png", width, height);
    if (!valid) continue;
    encodings.push({ level, bytes: buffer.byteLength });
    if (!best || buffer.byteLength < best.buffer.byteLength || (buffer.byteLength === best.buffer.byteLength && level < best.level)) best = { buffer, level };
  }
  if (!best) throw new Error("The PNG optimizer could not create a valid image.");
  return { buffer: best.buffer, level: best.level, encodings };
}

self.onmessage = async event => {
  try {
    const result = event.data.kind === "png" ? await optimizePng(event.data) : await encodeCandidates(event.data);
    self.postMessage({ ok: true, ...result }, [result.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message || "Image processing failed." });
  }
};
