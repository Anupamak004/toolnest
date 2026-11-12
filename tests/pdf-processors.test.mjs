import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { imagesToPdf, loadPdf, mergePdfs, parsePageGroups, rotatePdf, splitPdf } from "../lib/pdf-processors.mjs";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit=0;bit<8;bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(name, data) {
  const type = Buffer.from(name); const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0); type.copy(chunk, 4); data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([type,data])), 8 + data.length);
  return chunk;
}

function onePixelPng() {
  const header=Buffer.alloc(13); header.writeUInt32BE(1,0); header.writeUInt32BE(1,4); header[8]=8; header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk("IHDR",header),pngChunk("IDAT",deflateSync(Buffer.from([0,255,0,0,255]))),pngChunk("IEND",Buffer.alloc(0))]);
}

async function pdfWithPages(count) {
  const doc=await PDFDocument.create();
  for(let i=0;i<count;i++) doc.addPage([300+i*10,400]);
  return doc.save();
}

test("page range parser handles individual pages, ranges, all, and invalid input", () => {
  assert.deepEqual(parsePageGroups("1-3, 5",6),[[0,1,2],[4]]);
  assert.deepEqual(parsePageGroups("all",3,{allowAll:true}),[[0,1,2]]);
  assert.throws(()=>parsePageGroups("0",4),/between 1 and 4/);
  assert.throws(()=>parsePageGroups("3-2",4),/must come before/);
  assert.throws(()=>parsePageGroups("1,,2",4),/Separate/);
  assert.throws(()=>parsePageGroups("1-3, 3",4),/listed more than once/);
});

test("PDF validation gives a readable error for corrupt input", async () => {
  await assert.rejects(loadPdf(new Uint8Array([1,2,3])),/could not be opened/);
});

test("PDF merge keeps all pages and enforces multiple inputs", async () => {
  const first=await pdfWithPages(2); const second=await pdfWithPages(1);
  const result=await mergePdfs([first,second]);
  const merged=await PDFDocument.load(result);
  assert.equal(merged.getPageCount(),3);
  assert.deepEqual(merged.getPages().map(page=>page.getSize().width),[300,310,300]);
  await assert.rejects(mergePdfs([first]),/at least two/);
});

test("PDF split emits one valid PDF for every requested range", async () => {
  const source=await pdfWithPages(5); const parts=await splitPdf(source,"1-2, 4, 5");
  assert.deepEqual(parts.map(part=>part.pages),[[1,2],[4],[5]]);
  assert.deepEqual(await Promise.all(parts.map(async part=>(await PDFDocument.load(part.bytes)).getPageCount())),[2,1,1]);
});

test("PDF rotation changes only selected pages by the chosen angle", async () => {
  const source=await pdfWithPages(3); const result=await rotatePdf(source,"2",90); const doc=await PDFDocument.load(result);
  assert.equal(doc.getPage(0).getRotation().angle,0);
  assert.equal(doc.getPage(1).getRotation().angle,90);
  assert.equal(doc.getPage(2).getRotation().angle,0);
  await assert.rejects(rotatePdf(source,"all",45),/90, 180 or 270/);
});

test("images are embedded into correctly oriented PDF pages", async () => {
  const png=new Uint8Array(onePixelPng());
  const result=await imagesToPdf([{bytes:png,type:"png"}],{pageSize:"a4",orientation:"landscape"});
  const doc=await PDFDocument.load(result); const size=doc.getPage(0).getSize();
  assert.equal(doc.getPageCount(),1); assert.ok(size.width>size.height);
  await assert.rejects(imagesToPdf([{bytes:png,type:"webp"}]),/supports JPEG and PNG/);
});
