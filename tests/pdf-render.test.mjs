import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { rotatePdf } from "../lib/pdf-processors.mjs";

test("PDF.js renders a selected multi-page PDF page for PNG and JPEG export", async () => {
  const source=await PDFDocument.create(); source.addPage([80,60]); source.addPage([40,50]);
  const bytes=new Uint8Array(await source.save());
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task=pdfjs.getDocument({data:bytes,verbosity:0});
  try {
    const document=await task.promise; assert.equal(document.numPages,2);
    const pdfPage=await document.getPage(2); const viewport=pdfPage.getViewport({scale:1});
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    await pdfPage.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
    assert.equal(canvas.width,40); assert.equal(canvas.height,50);
    assert.deepEqual([...await canvas.encode("png")].slice(0,8),[137,80,78,71,13,10,26,10]);
    assert.equal((await canvas.encode("jpeg",90)).subarray(0,2).toString("hex"),"ffd8");
    await document.destroy();
  } finally { await task.destroy(); }
});

test("rotated PDF page displays with swapped viewport dimensions and selected-page scope",async()=>{
  const source=await PDFDocument.create();source.addPage([100,50]);source.addPage([80,40]);
  const rotated=await rotatePdf(await source.save(),"2",90);
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");const task=pdfjs.getDocument({data:new Uint8Array(rotated),verbosity:0});
  try{
    const document=await task.promise;const first=await document.getPage(1);const second=await document.getPage(2);
    const firstViewport=first.getViewport({scale:1});const secondViewport=second.getViewport({scale:1});
    assert.deepEqual([firstViewport.width,firstViewport.height],[100,50]);
    assert.deepEqual([secondViewport.width,secondViewport.height],[40,80]);
    await document.destroy();
  }finally{await task.destroy();}
});
