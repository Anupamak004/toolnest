"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { formatBytes, MAX_PDF_PAGES, MERGE_TOTAL_LIMIT_BYTES, PDF_LIMIT_BYTES, validatePdfFile } from "../../lib/file-validation.mjs";

function useObjectUrl(value) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!value) { setUrl(""); return; }
    const next = URL.createObjectURL(value); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [value]);
  return url;
}

function PdfPicker({ file, onFile, multiple = false, disabled = false, hint }) {
  const selected=Array.isArray(file)?file.length>0:Boolean(file);
  return <div className="tool-control"><span>Choose {multiple ? "PDF files" : "a PDF"}</span><label className="file-drop"><FileText size={21} aria-hidden="true" /><strong>{selected ? (Array.isArray(file) ? `${file.length} PDFs selected` : file.name) : "Select from your device"}</strong><span>{hint || `PDF only · up to ${formatBytes(PDF_LIMIT_BYTES)} per file and ${MAX_PDF_PAGES} pages`}</span><input type="file" accept=".pdf,application/pdf" multiple={multiple} disabled={disabled} onChange={event => { onFile(multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null); event.target.value = ""; }} aria-label={multiple ? "Choose PDF files" : "Choose PDF file"} /></label>{selected&&<button type="button" className="tool-button" disabled={disabled} onClick={()=>onFile(multiple?[]:null)}>Remove selected {multiple?"PDFs":"PDF"}</button>}</div>;
}

function ErrorNotice({ message }) { return message ? <div className="notice error" role="alert">{message}</div> : null; }

function OutputFile({ blob, filename, label }) {
  const url = useObjectUrl(blob);
  return <a className="tool-button" href={url || undefined} download={filename} aria-disabled={!url}><Download size={15} aria-hidden="true" /> {label || `Download ${filename}`}</a>;
}

function PdfResult({ blob, filename, title = "Generated PDF" }) {
  const url = useObjectUrl(blob);
  return <div className="result-panel"><h2>{title} · {formatBytes(blob.size)}</h2>{url&&<iframe className="page-preview" src={url} title={`${title} preview`} />}<OutputFile blob={blob} filename={filename} /></div>;
}

function PdfOutputPreview({ blob, title }) {
  const [open,setOpen]=useState(false); const url=useObjectUrl(open?blob:null);
  return <div className="output-preview"><button type="button" className="preview-toggle" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?"Hide":"Preview"} {title}</button>{open&&url&&<iframe className="page-preview" src={url} title={`${title} preview`} />}</div>;
}

function MergePdf() {
  const [files, setFiles] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [output, setOutput] = useState(null);
  function select(next) {
    setOutput(null); setError("");
    try {
      if (next.length > 20) throw new Error("Choose no more than 20 PDFs at a time.");
      const total = next.reduce((sum, file) => sum + file.size, 0);
      if (total > MERGE_TOTAL_LIMIT_BYTES) throw new Error(`The combined PDF size exceeds ${formatBytes(MERGE_TOTAL_LIMIT_BYTES)}.`);
      next.forEach(file => validatePdfFile(file)); setFiles(next);
    } catch (caught) { setFiles([]); setError(caught.message); }
  }
  function move(index, offset) { const target = index + offset; if (target < 0 || target >= files.length) return; const next = [...files]; [next[index], next[target]] = [next[target], next[index]]; setFiles(next); setOutput(null); }
  async function merge() {
    setError(""); setOutput(null); setLoading(true);
    try {
      if (files.length < 2) throw new Error("Choose at least two PDFs to merge.");
      const { mergePdfs } = await import("../../lib/pdf-processors.mjs");
      const bytes = await Promise.all(files.map(async file => new Uint8Array(await file.arrayBuffer())));
      setOutput(new Blob([await mergePdfs(bytes)], { type: "application/pdf" }));
    } catch (caught) { setError(caught.message || "The PDF files could not be merged."); }
    finally { setLoading(false); }
  }
  return <div className="tool-form"><PdfPicker file={files} multiple disabled={loading} onFile={select} hint={`Up to 20 files · ${formatBytes(PDF_LIMIT_BYTES)} each · ${formatBytes(MERGE_TOTAL_LIMIT_BYTES)} combined`} />
    {files.length > 0 && <ol className="file-list merge-list" aria-label="PDF order">{files.map((file,index)=><li className="file-row" key={`${file.name}-${file.size}-${index}`}><span>{index+1}. {file.name} · {formatBytes(file.size)}</span><span className="file-actions"><button type="button" className="icon-button" onClick={() => move(index,-1)} disabled={loading||!index} aria-label={`Move ${file.name} up`}><ArrowUp size={15} /></button><button type="button" className="icon-button" onClick={() => move(index,1)} disabled={loading||index===files.length-1} aria-label={`Move ${file.name} down`}><ArrowDown size={15} /></button><button type="button" className="icon-button" disabled={loading} onClick={() => { setFiles(files.filter((_,i)=>i!==index)); setOutput(null); }} aria-label={`Remove ${file.name}`}><Trash2 size={15} /></button></span></li>)}</ol>}
    <div className="button-row"><button type="button" className="tool-button primary" onClick={merge} disabled={files.length<2 || loading}>{loading ? <><LoaderCircle size={16} className="spin" /> Merging…</> : "Merge PDFs"}</button><span className="hint">Maximum merged output: {MAX_PDF_PAGES} pages.</span></div><ErrorNotice message={error} />
    {output && <PdfResult blob={output} filename="merged.pdf" title="Merged PDF preview" />}
  </div>;
}

function SinglePdfWorkspace({ operation }) {
  const [file, setFile] = useState(null); const [pageCount, setPageCount] = useState(null); const [selectionVersion, setSelectionVersion] = useState(0); const [pageRange, setPageRange] = useState(operation === "rotate" ? "all" : ""); const [angle, setAngle] = useState(90); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [outputs, setOutputs] = useState([]);
  function select(next) {
    setError(""); setOutputs([]); setPageCount(null); setFile(null); setSelectionVersion(value=>value+1);
    if (!next) return;
    try { validatePdfFile(next); setFile(next); setPageRange(operation === "rotate" ? "all" : ""); }
    catch (caught) { setError(caught.message); }
  }
  useEffect(() => {
    if (!file) return undefined;
    let cancelled = false;
    async function inspect() {
      setError(""); setLoading(true);
      try { const { loadPdf } = await import("../../lib/pdf-processors.mjs"); const doc = await loadPdf(new Uint8Array(await file.arrayBuffer())); if (!cancelled) setPageCount(doc.getPageCount()); }
      catch (caught) { if (!cancelled) { setError(caught.message || "This PDF could not be read."); setFile(null); } }
      finally { if (!cancelled) setLoading(false); }
    }
    inspect();
    return () => { cancelled = true; };
  }, [file, selectionVersion]);
  async function process() {
    setError(""); setOutputs([]); setLoading(true);
    try {
      if (!file) throw new Error("Choose a PDF file to continue.");
      const bytes = new Uint8Array(await file.arrayBuffer()); const processors = await import("../../lib/pdf-processors.mjs");
      if (operation === "split") {
        const parts = await processors.splitPdf(bytes, pageRange);
        setOutputs(parts.map(part => ({ name: `${file.name.replace(/\.pdf$/i, "")}-${part.name}`, blob: new Blob([part.bytes], { type: "application/pdf" }), detail: `Pages ${part.pages.join(", ")}` })));
      } else {
        const result = await processors.rotatePdf(bytes, pageRange, Number(angle));
        setOutputs([{ name: `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`, blob: new Blob([result], { type: "application/pdf" }), detail: `Selected pages rotated ${angle}°` }]);
      }
    } catch (caught) { setError(caught.message || `This PDF could not be ${operation === "split" ? "split" : "rotated"}.`); }
    finally { setLoading(false); }
  }
  return <div className="tool-form"><PdfPicker file={file} disabled={loading} onFile={select} />{pageCount && <p className="hint">{pageCount} pages · up to {MAX_PDF_PAGES} pages supported</p>}
    {operation === "split" ? <label className="tool-control">Page ranges to extract<input disabled={loading} value={pageRange} onChange={event=>{setPageRange(event.target.value);setOutputs([]);setError("");}} placeholder="1-3, 5, 7-8" aria-describedby="split-hint" /><small id="split-hint">Each comma-separated item becomes a separate PDF. For example, “1-3, 5” creates a 3-page PDF and a single-page PDF.</small></label> : <><label className="tool-control">Pages to rotate<input disabled={loading} value={pageRange} onChange={event=>{setPageRange(event.target.value);setOutputs([]);setError("");}} placeholder="all or 1-3, 5" /><small>Enter “all” or comma-separated page numbers and ranges.</small></label><label className="tool-control">Rotation angle<select disabled={loading} value={angle} onChange={event=>{setAngle(Number(event.target.value));setOutputs([]);}}><option value={90}>90° clockwise</option><option value={180}>180°</option><option value={270}>270° clockwise</option></select></label></>}
    <div className="button-row"><button type="button" className="tool-button primary" onClick={process} disabled={!file || loading}>{loading ? <><LoaderCircle size={16} className="spin" /> Processing…</> : operation === "split" ? "Extract pages" : "Rotate pages"}</button></div><ErrorNotice message={error} />
    {outputs.length > 0 && operation === "split" && <div className="result-panel"><h2>Extracted PDFs</h2>{outputs.map(output=><div className="split-output" key={output.name}><div className="file-row"><span>{output.name} · {output.detail} · {formatBytes(output.blob.size)}</span><OutputFile blob={output.blob} filename={output.name} label="Download" /></div><PdfOutputPreview blob={output.blob} title={output.name} /></div>)}</div>}
    {outputs.length > 0 && operation === "rotate" && <PdfResult blob={outputs[0].blob} filename={outputs[0].name} title="Rotated PDF preview" />}
  </div>;
}

function PdfToImages() {
  const [file, setFile] = useState(null); const [selectionVersion, setSelectionVersion] = useState(0); const [format, setFormat] = useState("png"); const [page, setPage] = useState(1); const [pageCount, setPageCount] = useState(0); const [loading, setLoading] = useState(false); const [exporting, setExporting] = useState(false); const [error, setError] = useState(""); const [output, setOutput] = useState(null); const [dimensions, setDimensions] = useState(null);
  const exportRequest = useRef(0);
  const canvasRef = useRef(null); const outputUrl = useObjectUrl(output);
  useEffect(() => () => { exportRequest.current += 1; }, []);
  function select(next) {
    exportRequest.current += 1; setExporting(false); setSelectionVersion(value=>value+1);
    setError(""); setOutput(null); setPage(1); setPageCount(0); setDimensions(null);
    if (!next) { setFile(null); return; }
    try { validatePdfFile(next); setFile(next); }
    catch (caught) { setFile(null); setError(caught.message); }
  }
  useEffect(() => {
    if (!file || !canvasRef.current) return undefined;
    let cancelled = false; let pdfDocument; let loadingTask; let renderTask;
    async function render() {
      setLoading(true); setError(""); setOutput(null);
      try {
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (cancelled) return;
        loadingTask = pdfjs.getDocument({ data: bytes });
        pdfDocument = await loadingTask.promise;
        if (cancelled) { await pdfDocument.destroy(); return; }
        if (pdfDocument.numPages > MAX_PDF_PAGES) {
          await pdfDocument.destroy(); pdfDocument = null; loadingTask = null;
          throw new Error(`This tool supports up to ${MAX_PDF_PAGES} pages per PDF.`);
        }
        if (cancelled) return;
        setPageCount(pdfDocument.numPages);
        const current = Math.min(page, pdfDocument.numPages);
        if (current !== page) setPage(current);
        const pdfPage = await pdfDocument.getPage(current);
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(1.5, 5000/base.width, 5000/base.height, Math.sqrt(25000000/(base.width*base.height)));
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current; if (!canvas || cancelled) return;
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d"); if (!context) throw new Error("Your browser could not prepare a page preview.");
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setDimensions({ width: canvas.width, height: canvas.height });
      } catch (caught) {
        if (!cancelled && caught?.name !== "RenderingCancelledException") setError(caught.message || "This PDF page could not be rendered.");
      } finally { if (!cancelled) setLoading(false); }
    }
    render();
    return () => { cancelled = true; renderTask?.cancel(); loadingTask?.destroy(); };
  }, [file, page, selectionVersion]);
  function changePage(nextPage) {
    exportRequest.current += 1; setExporting(false); setOutput(null); setPage(nextPage);
  }
  function downloadPage() {
    const canvas = canvasRef.current; if (!canvas) return;
    const request = ++exportRequest.current; const exportFormat = format;
    setError(""); setExporting(true);
    canvas.toBlob(blob => {
      if (request !== exportRequest.current) return;
      setExporting(false);
      const expectedMime = exportFormat === "jpg" ? "image/jpeg" : "image/png";
      if (blob?.type === expectedMime) setOutput(blob);
      else setError(`This page could not be exported as ${exportFormat.toUpperCase()}.`);
    }, exportFormat === "jpg" ? "image/jpeg" : "image/png", .92);
  }
  const downloadName = file ? `${file.name.replace(/\.pdf$/i, "")}-page-${page}.${format}` : `page-${page}.${format}`;
  return <div className="tool-form"><PdfPicker file={file} disabled={loading||exporting} onFile={select} hint={`PDF only · up to ${formatBytes(PDF_LIMIT_BYTES)} and ${MAX_PDF_PAGES} pages`} />
    {file && <><div className="tool-controls-row"><label className="tool-control">Image format<select value={format} disabled={loading||exporting} onChange={event=>{exportRequest.current+=1;setFormat(event.target.value);setOutput(null);}}><option value="png">PNG</option><option value="jpg">JPEG</option></select></label><div className="tool-control">Page to preview{pageCount > 0 ? <div className="page-stepper"><button type="button" className="icon-button" onClick={()=>changePage(Math.max(1,page-1))} disabled={page<=1 || loading || exporting} aria-label="Previous PDF page">←</button><span>Page {page} of {pageCount}</span><button type="button" className="icon-button" onClick={()=>changePage(Math.min(pageCount,page+1))} disabled={page>=pageCount || loading || exporting} aria-label="Next PDF page">→</button></div> : <span className="hint">Reading page count…</span>}</div></div>
      <div className="result-panel"><div className="preview-toolbar"><h2>Page preview</h2>{dimensions && <span>{dimensions.width} × {dimensions.height} px</span>}</div>{(loading||exporting) && <p className="hint" role="status"><LoaderCircle size={14} className="spin" /> {loading?"Rendering page locally…":"Preparing image…"}</p>}<canvas ref={canvasRef} className="canvas-preview" aria-label={`Preview of page ${page}`} />{pageCount>0 && <button type="button" className="tool-button primary" onClick={downloadPage} disabled={loading || exporting || !dimensions}><Download size={15} /> {exporting?"Preparing image…":`Export page as ${format.toUpperCase()}`}</button>}{output && outputUrl && <><div className="preview-card"><img src={outputUrl} alt={`Exported page ${page} preview`} /><strong>{downloadName}</strong><span>{formatBytes(output.size)}</span></div><a className="tool-button" href={outputUrl} download={downloadName}><Download size={15} /> Download page image</a></>}</div></>}
    <ErrorNotice message={error} />
  </div>;
}

export default function PdfTools({ slug }) {
  if (slug === "merge-pdf") return <MergePdf />;
  if (slug === "split-pdf") return <SinglePdfWorkspace operation="split" />;
  if (slug === "rotate-pdf") return <SinglePdfWorkspace operation="rotate" />;
  if (slug === "pdf-to-images") return <PdfToImages />;
  return null;
}
