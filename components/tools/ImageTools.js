"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, LoaderCircle, Trash2 } from "lucide-react";
import { calculateSizeReduction, compressImage, processBitmap } from "../../lib/image-processors.mjs";
import { createObjectUrlLease } from "../../lib/object-url.mjs";
import { formatBytes, getImageExtensionFromMime, getImageFormat, IMAGE_LIMIT_BYTES, IMAGE_TO_PDF_TOTAL_LIMIT_BYTES, IMAGE_TO_PDF_MAX_FILES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, validateImageDimensions, validateImageFile, validateImageFileContent } from "../../lib/file-validation.mjs";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

function useObjectUrl(value) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const lease = createObjectUrlLease(value);
    setUrl(lease.url);
    return lease.release;
  }, [value]);
  return url;
}

function ImagePicker({ file, onFile, accept = IMAGE_ACCEPT, multiple = false, disabled = false, hint = `JPEG, PNG or WebP · up to ${formatBytes(IMAGE_LIMIT_BYTES)} per image · 10000 px per side / 40 MP maximum` }) {
  const selected=Array.isArray(file)?file.length>0:Boolean(file);
  return <div className="tool-control"><span>Choose {multiple ? "images" : "an image"}</span><label className="file-drop"><FileImage size={21} aria-hidden="true" /><strong>{selected ? (Array.isArray(file) ? `${file.length} images selected` : file.name) : "Select from your device"}</strong><span>{hint}</span><input type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={event => { onFile(multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null); event.target.value = ""; }} aria-label={multiple ? "Choose image files" : "Choose image file"} /></label>{selected&&<button type="button" className="tool-button" disabled={disabled} onClick={()=>onFile(multiple?[]:null)}>Remove selected {multiple?"images":"image"}</button>}</div>;
}

function useImagePreview(file) {
  return useObjectUrl(file);
}

function ErrorNotice({ message }) { return message ? <div className="notice error" role="alert">{message}</div> : null; }

function DownloadButton({ url, filename, label = `Download ${filename}` }) {
  return url ? <a className="tool-button primary" href={url} download={filename}><Download size={16} aria-hidden="true" /> {label}</a> : null;
}

function PreviewPair({ original, result, resultName = "Processed image" }) {
  const sourceUrl = useImagePreview(original);
  const outputUrl = useObjectUrl(result?.blob);
  if (!original) return null;
  return <div className="preview-grid"><div className="preview-card">{sourceUrl && <img src={sourceUrl} alt="Original image preview" />}<strong>Original</strong><span>{original.name} · {formatBytes(original.size)}</span></div>{result && <div className="preview-card">{outputUrl && <img src={outputUrl} alt={`${resultName} preview`} />}<strong>{resultName}</strong><span>{result.width} × {result.height} px · {formatBytes(result.blob.size)}</span></div>}</div>;
}

async function decodeFile(file) {
  try { return await createImageBitmap(file); }
  catch { throw new Error("This image could not be decoded. Try a valid JPEG, PNG or WebP file."); }
}

function requestImageCodecWorker(payload, transfer) {
  return new Promise((resolve, reject) => {
    let worker;
    try { worker = new Worker(new URL("./image-codec.worker.js", import.meta.url), { type: "module" }); }
    catch (error) { reject(error); return; }
    const finish = callback => value => { worker.terminate(); callback(value); };
    worker.onmessage = finish(event => event.data?.ok ? resolve(event.data) : reject(new Error(event.data?.error || "Image processing failed.")));
    worker.onerror = finish(event => reject(new Error(event.message || "The image processing worker could not start.")));
    try { worker.postMessage(payload, transfer); }
    catch (error) { worker.terminate(); reject(error); }
  });
}

function createImageCodecAdapters() {
  if (typeof Worker === "undefined") return {};
  return {
    encodeCandidates: async (imageData, { format, qualities }) => {
      const pixels = imageData.data.buffer;
      const result = await requestImageCodecWorker({ kind: "encode", format, pixels, width: imageData.width, height: imageData.height, qualities }, [pixels]);
      return { blob: new Blob([result.buffer], { type: format === "jpeg" ? "image/jpeg" : "image/webp" }), quality: result.quality, encodings: result.encodings };
    },
    optimizePng: async (file, { levels, width, height }) => {
      const bytes = await file.arrayBuffer();
      const result = await requestImageCodecWorker({ kind: "png", bytes, levels, width, height }, [bytes]);
      return { blob: new Blob([result.buffer], { type: "image/png" }), level: result.level, encodings: result.encodings };
    },
  };
}

function ImageCompressor() {
  const [file, setFile] = useState(null); const [quality, setQuality] = useState(78); const [optimizationLevel, setOptimizationLevel] = useState(2); const [outputChoice, setOutputChoice] = useState("original"); const [background, setBackground] = useState("#ffffff"); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const originalUrl = useImagePreview(file);
  const resultUrl = useObjectUrl(result?.blob);
  async function compress() {
    setError(""); setResult(null); setLoading(true);
    try {
      const format = await validateImageFileContent(file);
      const bitmap = await decodeFile(file);
      try {
        const outputFormat = outputChoice === "original" ? format : outputChoice;
        const settings = await compressImage(bitmap, file, { format, outputFormat, minimumQuality: quality / 100, optimizationLevel, background, adapters: createImageCodecAdapters() });
        const { blob }=settings;
        if(!settings.originalRetained && blob.type!==`image/${settings.format}`) throw new Error(`This browser cannot export ${settings.format.toUpperCase()} without changing the image format. The original file was left unchanged.`);
        const actualExtension=getImageExtensionFromMime(blob.type);
        if(!actualExtension) throw new Error("The browser returned an unsupported image type. The original was left unchanged.");
        const stem = file.name.replace(/\.[^.]+$/, "");
        const reduction=calculateSizeReduction(file.size,blob.size);
        const filename=settings.originalRetained?file.name:`${stem}-${settings.converted?"converted":"compressed"}.${actualExtension}`;
        setResult({ blob: settings.originalRetained ? null : blob, width: bitmap.width, height: bitmap.height, originalWidth:bitmap.width, originalHeight:bitmap.height, filename, reduction, format: settings.format, sourceFormat: format, qualityUsed:settings.qualityUsed, optimizationLevel:settings.optimizationLevel, originalRetained:settings.originalRetained, converted:settings.converted });
      } finally { bitmap.close(); }
    } catch (caught) { setError(caught.message || "The image could not be compressed."); }
    finally { setLoading(false); }
  }
  const sourceFormat=file?getImageFormat(file):null;
  const targetFormat=outputChoice==="original"?sourceFormat:outputChoice;
  const choices=sourceFormat?[
    {value:"original",label:`Keep original format (${sourceFormat.toUpperCase()})`},
    ...(sourceFormat!=="webp"?[{value:"webp",label:"Convert to WebP"}]:[]),
    ...(sourceFormat!=="jpeg"?[{value:"jpeg",label:"Convert to JPEG"}]:[]),
    ...(sourceFormat!=="png"?[{value:"png",label:"Convert to PNG"}]:[]),
  ]:[];
  const isConversion=Boolean(sourceFormat&&targetFormat!==sourceFormat);
  const mayHaveTransparency=sourceFormat==="png"||sourceFormat==="webp";
  const outputUrl=result?.originalRetained?originalUrl:resultUrl;
  return <div className="tool-form"><ImagePicker file={file} disabled={loading} onFile={next => { setFile(next); setResult(null); setError(""); setOutputChoice("original"); }} />
    {file&&<label className="tool-control">Output format<select disabled={loading} value={outputChoice} onChange={event=>{setOutputChoice(event.target.value);setResult(null);setError("");}}>{choices.map(choice=><option value={choice.value} key={choice.value}>{choice.label}</option>)}</select></label>}
    {targetFormat!=="png"&&<label className="tool-control">Compression quality: {quality}%<input type="range" min="55" max="100" step="1" value={quality} disabled={loading} onChange={event => {setQuality(Number(event.target.value));setResult(null);}} aria-label="Compression quality" aria-valuetext={`${quality} percent`} /><small>We compare several quality settings and keep the smallest suitable result.</small></label>}
    {sourceFormat==="png"&&targetFormat==="png"&&<label className="tool-control">PNG optimization level: {optimizationLevel}<input type="range" min="1" max="4" step="1" value={optimizationLevel} disabled={loading} onChange={event=>{setOptimizationLevel(Number(event.target.value));setResult(null);}} aria-label="PNG optimization level" /><small>Higher levels take longer. At level 4, edges around transparent pixels may look slightly different.</small></label>}
    {isConversion&&<div className="notice info" role="status">The converted file may be larger than the original.</div>}
    {isConversion&&targetFormat==="jpeg"&&mayHaveTransparency&&<label className="tool-control">Background color for transparent areas<span className="color-field"><input type="color" value={background} disabled={loading} onChange={event=>{setBackground(event.target.value);setResult(null);}} aria-label="Background color for transparent areas" /><span>{background.toUpperCase()}</span></span></label>}
    <div className="button-row"><button type="button" className="tool-button primary" onClick={compress} disabled={!file || loading} aria-busy={loading}>{loading?<><LoaderCircle size={16} className="spin" /> Processing image…</>:isConversion?`Convert to ${targetFormat.toUpperCase()}`:sourceFormat==="png"?"Optimize PNG":"Compress image"}</button><span className="hint">Maximum source size: {formatBytes(IMAGE_LIMIT_BYTES)} · processing stays on your device</span></div><ErrorNotice message={error} />
    {result && <div className="result-panel"><h2>{result.originalRetained?"Original retained":result.converted?"Image converted":result.sourceFormat==="png"?"PNG optimized":"Image compressed"}</h2><div className="result-stats"><div className="stat-card"><strong>{formatBytes(file.size)}</strong><span>Original file size · {file.size.toLocaleString()} bytes</span></div><div className="stat-card"><strong>{formatBytes(result.blob?.size ?? file.size)}</strong><span>Output file size · {(result.blob?.size ?? file.size).toLocaleString()} bytes</span></div><div className="stat-card"><strong>{result.reduction.toFixed(2)}%</strong><span>{result.reduction<0?"Larger than original":"Saved"}</span></div><div className="stat-card"><strong>{result.sourceFormat.toUpperCase()}</strong><span>Original format</span></div><div className="stat-card"><strong>{result.format.toUpperCase()}</strong><span>Output format</span></div><div className="stat-card"><strong>{result.originalWidth} × {result.originalHeight} px</strong><span>Original dimensions</span></div><div className="stat-card"><strong>{result.width} × {result.height} px</strong><span>Output dimensions</span></div>{result.qualityUsed!=null&&<div className="stat-card"><strong>{Math.round(result.qualityUsed*100)}%</strong><span>Compression quality</span></div>}{result.optimizationLevel!=null&&<div className="stat-card"><strong>{result.optimizationLevel}</strong><span>PNG optimization level</span></div>}</div>{result.originalRetained&&<div className="notice info" role="status">{result.sourceFormat==="png"?"No smaller PNG was available, so the original file was retained.":"No smaller result was available at this quality, so the original file was retained."}</div>}{result.converted&&result.reduction<0&&<div className="notice warning" role="status">The converted image is {Math.abs(result.reduction).toFixed(2)}% larger than the original.</div>}<PreviewPair original={file} result={{...result,blob:result.blob||file}} resultName={result.originalRetained?"Original retained":"Processed image"} /><DownloadButton url={outputUrl} filename={result.filename} label={result.originalRetained?"Download original":"Download image"} /></div>}
  </div>;
}

function ImageResizer() {
  const [file, setFile] = useState(null); const [size, setSize] = useState(null); const [width, setWidth] = useState(""); const [height, setHeight] = useState(""); const [preserve, setPreserve] = useState(true); const [quality, setQuality] = useState(90); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const resultUrl = useObjectUrl(result?.blob);
  useEffect(() => {
    if (!file) { setSize(null); return; }
    let active = true; let bitmap;
    createImageBitmap(file).then(decoded => { if (!active) { decoded.close(); return; } bitmap = decoded; setSize({ width: decoded.width, height: decoded.height }); setWidth(String(decoded.width)); setHeight(String(decoded.height)); }).catch(() => { if (active) setError("This image could not be decoded. Choose a valid JPEG, PNG or WebP file."); });
    return () => { active = false; bitmap?.close(); };
  }, [file]);
  async function resize() {
    setError(""); setResult(null); setLoading(true);
    try {
      const format = await validateImageFileContent(file);
      let targetWidth = Number(width); let targetHeight = Number(height);
      if (preserve && size) {
        if (!Number.isInteger(targetWidth) || targetWidth < 1) throw new Error("Enter a positive whole-number width.");
        targetHeight = Math.round(targetWidth * size.height / size.width); setHeight(String(targetHeight));
      }
      validateImageDimensions(targetWidth, targetHeight);
      const bitmap = await decodeFile(file);
      try {
        const mime=format==="jpeg"?"image/jpeg":`image/${format}`;
        const { blob } = await processBitmap(bitmap, { width: targetWidth, height: targetHeight, mimeType: mime, quality: format === "png" ? undefined : quality / 100 });
        if(blob.type!==mime) throw new Error(`This browser cannot export ${format.toUpperCase()} without changing the image format.`);
        const extension=getImageExtensionFromMime(blob.type);
        if(!extension) throw new Error("The browser returned an unsupported image type.");
        setResult({ blob, width: targetWidth, height: targetHeight, filename: `${file.name.replace(/\.[^.]+$/, "")}-${targetWidth}x${targetHeight}.${extension}` });
      } finally { bitmap.close(); }
    } catch (caught) { setError(caught.message || "The image could not be resized."); }
    finally { setLoading(false); }
  }
  const aspect = size ? size.width / size.height : 1;
  return <div className="tool-form"><ImagePicker file={file} disabled={loading} onFile={next => { setFile(next); setSize(null); setWidth(""); setHeight(""); setResult(null); setError(""); }} />{size && <p className="hint">Original dimensions: {size.width} × {size.height} px · maximum {MAX_IMAGE_DIMENSION} px per side and {MAX_IMAGE_PIXELS.toLocaleString()} pixels total.</p>}
    <div className="tool-controls-row"><label className="tool-control">Width (px)<input type="number" min="1" max={MAX_IMAGE_DIMENSION} disabled={loading} value={width} onChange={event => { const next = event.target.value; setWidth(next); setResult(null); if (preserve && size && Number(next) > 0) setHeight(String(Math.round(Number(next) / aspect))); }} placeholder="Width" /></label><label className="tool-control">Height (px)<input type="number" min="1" max={MAX_IMAGE_DIMENSION} disabled={loading} value={height} onChange={event => { const next = event.target.value; setHeight(next); setResult(null); if (!preserve && size && Number(next) > 0) return; if (preserve && size && Number(next) > 0) setWidth(String(Math.round(Number(next) * aspect))); }} placeholder="Height" /></label></div>
    <label className="check-row"><input type="checkbox" checked={preserve} disabled={loading} onChange={event => { setPreserve(event.target.checked); setResult(null); if (event.target.checked && size && Number(width) > 0) setHeight(String(Math.round(Number(width) / aspect))); }} /> Preserve aspect ratio</label>
    {file && getImageFormat(file)!=="png" && <label className="tool-control">Output quality: {quality}%<input type="range" min="10" max="100" disabled={loading} value={quality} onChange={event => {setQuality(Number(event.target.value));setResult(null);}} aria-label="Resized image quality" /></label>}
    <div className="button-row"><button type="button" className="tool-button primary" onClick={resize} disabled={!file || !size || loading}>{loading && <LoaderCircle size={16} className="spin" />} Resize image</button></div><ErrorNotice message={error} />
    {result && <div className="result-panel"><h2>Resized image</h2><PreviewPair original={file} result={result} resultName="Resized image" /><DownloadButton url={resultUrl} filename={result.filename} /></div>}
  </div>;
}

function ImageConverter({ to }) {
  const from = to === "png" ? "jpeg" : "png";
  const accept = from === "jpeg" ? ".jpg,.jpeg,image/jpeg" : ".png,image/png";
  const [file, setFile] = useState(null); const [background, setBackground] = useState("#ffffff"); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const resultUrl = useObjectUrl(result?.blob);
  async function convert() {
    setError(""); setResult(null); setLoading(true);
    try {
      await validateImageFileContent(file, { formats: [from] });
      const bitmap = await decodeFile(file);
      try {
        validateImageDimensions(bitmap.width, bitmap.height);
        const { processBitmap } = await import("../../lib/image-processors.mjs");
        const { blob } = await processBitmap(bitmap, { mimeType: to === "jpg" ? "image/jpeg" : "image/png", quality: to === "jpg" ? .92 : undefined, background: to === "jpg" ? background : null });
        if (blob.type !== (to === "jpg" ? "image/jpeg" : "image/png")) throw new Error(`This browser could not export ${to.toUpperCase()} images.`);
        const extension=getImageExtensionFromMime(blob.type);
        if(!extension) throw new Error("The browser returned an unsupported image type.");
        setResult({ blob, width: bitmap.width, height: bitmap.height, filename: `${file.name.replace(/\.[^.]+$/, "")}.${extension}` });
      } finally { bitmap.close(); }
    } catch (caught) { setError(caught.message || `The image could not be converted to ${to.toUpperCase()}.`); }
    finally { setLoading(false); }
  }
  return <div className="tool-form"><ImagePicker file={file} disabled={loading} accept={accept} hint={`${from.toUpperCase()} only · up to ${formatBytes(IMAGE_LIMIT_BYTES)} · 10000 px per side / 40 MP maximum`} onFile={next => { setFile(next); setResult(null); setError(""); }} />
    {to === "jpg" && <label className="tool-control">Background for transparent pixels<span className="color-field"><input type="color" value={background} disabled={loading} onChange={event => {setBackground(event.target.value);setResult(null);}} aria-label="JPG background color" /><span>{background.toUpperCase()}</span></span></label>}
    <div className="button-row"><button type="button" className="tool-button primary" onClick={convert} disabled={!file || loading}>{loading && <LoaderCircle size={16} className="spin" />} Convert to {to.toUpperCase()}</button><span className="hint">Image data is converted locally.</span></div><ErrorNotice message={error} />
    {result && <div className="result-panel"><h2>Converted image</h2><PreviewPair original={file} result={result} resultName={`${to.toUpperCase()} image`} /><DownloadButton url={resultUrl} filename={result.filename} /></div>}
  </div>;
}

function ImageToPdf() {
  const [files, setFiles] = useState([]); const [pageSize, setPageSize] = useState("a4"); const [orientation, setOrientation] = useState("portrait"); const [output, setOutput] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const outputUrl = useObjectUrl(output);
  function choose(next) {
    setError(""); setOutput(null);
    try {
      if (!next.length) { setFiles([]); return; }
      if (next.length > IMAGE_TO_PDF_MAX_FILES) throw new Error(`Choose no more than ${IMAGE_TO_PDF_MAX_FILES} images at a time.`);
      const total = next.reduce((sum, file) => sum + file.size, 0);
      if (total > IMAGE_TO_PDF_TOTAL_LIMIT_BYTES) throw new Error(`The combined image size exceeds ${formatBytes(IMAGE_TO_PDF_TOTAL_LIMIT_BYTES)}.`);
      next.forEach(file => validateImageFile(file)); setFiles(next);
    } catch (caught) { setFiles([]); setError(caught.message); }
  }
  function moveImage(index,direction) {
    const destination=index+direction;
    if(destination<0||destination>=files.length) return;
    const reordered=[...files]; [reordered[index],reordered[destination]]=[reordered[destination],reordered[index]];
    setFiles(reordered); setOutput(null);
  }
  async function createPdf() {
    setError(""); setOutput(null); setLoading(true);
    try {
      if (!files.length) throw new Error("Choose at least one image.");
      const pages = [];
      for (const file of files) {
        const format = await validateImageFileContent(file);
        let bytes = new Uint8Array(await file.arrayBuffer()); let kind = format;
        if (format === "webp") {
          const bitmap = await decodeFile(file);
          try { const { blob } = await processBitmap(bitmap, { mimeType: "image/png" }); bytes = new Uint8Array(await blob.arrayBuffer()); kind = "png"; }
          finally { bitmap.close(); }
        }
        pages.push({ bytes, type: kind });
      }
      const { imagesToPdf } = await import("../../lib/pdf-processors.mjs");
      setOutput(new Blob([await imagesToPdf(pages, { pageSize, orientation })], { type: "application/pdf" }));
    } catch (caught) { setError(caught.message || "A PDF could not be created from these images."); }
    finally { setLoading(false); }
  }
  return <div className="tool-form"><label className="tool-control">Choose images<span className="file-drop"><FileImage size={21} aria-hidden="true" /><strong>{files.length ? `${files.length} images selected` : "Select one or more images"}</strong><span>JPEG, PNG or WebP · up to {formatBytes(IMAGE_LIMIT_BYTES)} each; {formatBytes(IMAGE_TO_PDF_TOTAL_LIMIT_BYTES)} combined; {IMAGE_TO_PDF_MAX_FILES} files maximum</span><input type="file" accept={IMAGE_ACCEPT} multiple disabled={loading} onChange={event => { choose(Array.from(event.target.files || [])); event.target.value = ""; }} aria-label="Choose images for PDF" /></span></label>
    {files.length > 0 && <ul className="file-list">{files.map((file,index)=><li className="file-row" key={`${file.name}-${file.size}-${index}`}><span>{index+1}. {file.name} · {formatBytes(file.size)}</span><span className="file-actions"><button type="button" className="icon-button" onClick={()=>moveImage(index,-1)} disabled={loading||!index} aria-label={`Move ${file.name} up`}><ArrowUp size={15} /></button><button type="button" className="icon-button" onClick={()=>moveImage(index,1)} disabled={loading||index===files.length-1} aria-label={`Move ${file.name} down`}><ArrowDown size={15} /></button><button type="button" className="icon-button" onClick={()=>{setFiles(files.filter((_,i)=>i!==index));setOutput(null);}} disabled={loading} aria-label={`Remove ${file.name}`}><Trash2 size={15} /></button></span></li>)}</ul>}
    <div className="tool-controls-row"><label className="tool-control">Page size<select value={pageSize} disabled={loading} onChange={event => {setPageSize(event.target.value);setOutput(null);}}><option value="a4">A4</option><option value="letter">US Letter</option><option value="fit">Fit each image</option></select></label><label className="tool-control">Orientation<select value={orientation} disabled={loading||pageSize === "fit"} onChange={event => {setOrientation(event.target.value);setOutput(null);}}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>
    <div className="button-row"><button type="button" className="tool-button primary" onClick={createPdf} disabled={!files.length || loading}>{loading ? <><LoaderCircle size={16} className="spin" /> Creating PDF…</> : "Create PDF"}</button></div><ErrorNotice message={error} />
    {output && <div className="result-panel"><h2>PDF preview</h2><p className="hint">{files.length} page{files.length===1?"":"s"} · {formatBytes(output.size)} · generated in this browser</p>{outputUrl&&<iframe className="page-preview" title="Generated image PDF preview" src={outputUrl} />}<DownloadButton url={outputUrl} filename="images.pdf" /></div>}
  </div>;
}

export default function ImageTools({ slug }) {
  if (slug === "image-compressor") return <ImageCompressor />;
  if (slug === "image-resizer") return <ImageResizer />;
  if (slug === "jpg-to-png") return <ImageConverter to="png" />;
  if (slug === "png-to-jpg") return <ImageConverter to="jpg" />;
  if (slug === "image-to-pdf") return <ImageToPdf />;
  return null;
}
