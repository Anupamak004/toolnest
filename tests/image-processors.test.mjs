import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { calculateSizeReduction, compressImage, getCompressionQualities, getPngOptimizationLevels, processBitmap, processBitmapAtQualities } from "../lib/image-processors.mjs";
import { getImageExtensionFromMime, validateImageFileContent } from "../lib/file-validation.mjs";

async function pngImage(width,height,paint) {
  const canvas=createCanvas(width,height); paint(canvas.getContext("2d"));
  return loadImage(await canvas.encode("png"));
}

const adapters={
  createCanvas:(width,height)=>createCanvas(width,height),
  encode:async(canvas,mimeType,quality)=>new Blob([mimeType==="image/jpeg" ? await canvas.encode("jpeg",Math.round((quality ?? .92)*100)) : mimeType==="image/webp" ? await canvas.encode("webp",Math.round((quality ?? .92)*100)) : await canvas.encode("png")],{type:mimeType}),
};

const [jpegEncoder,webpEncoder,pngOptimizer]=await Promise.all([
  import("@jsquash/jpeg/encode.js"),import("@jsquash/webp/encode.js"),import("@jsquash/oxipng/optimise.js"),
]);
const packageRoot=new URL("../node_modules/@jsquash/",import.meta.url);
await jpegEncoder.init(await WebAssembly.compile(await readFile(new URL("jpeg/codec/enc/mozjpeg_enc.wasm",packageRoot))));
await webpEncoder.init(await WebAssembly.compile(await readFile(new URL("webp/codec/enc/webp_enc.wasm",packageRoot))));
await pngOptimizer.init(await WebAssembly.compile(await readFile(new URL("oxipng/codec/pkg/squoosh_oxipng_bg.wasm",packageRoot))));
const codecAdapters={
  createCanvas:(width,height)=>createCanvas(width,height),
  encodeCandidates:async(imageData,{format,qualities})=>{
    const encoder=format==="jpeg"?jpegEncoder.default:webpEncoder.default;
    return Promise.all(qualities.map(async quality=>({blob:new Blob([await encoder(imageData,{quality:Math.round(quality*100)})],{type:format==="jpeg"?"image/jpeg":"image/webp"}),quality})));
  },
  optimizePng:async(original,{levels})=>{
    const candidates=[]; const bytes=await original.arrayBuffer();
    for(const level of levels) candidates.push({blob:new Blob([await pngOptimizer.default(bytes.slice(0),{level,optimiseAlpha:level===4})],{type:"image/png"}),level});
    return candidates;
  },
};

test("image processing resizes real image pixels to requested dimensions",async()=>{
  const source=await pngImage(2,1,context=>{context.fillStyle="#ff0000";context.fillRect(0,0,2,1);});
  const result=await processBitmap(source,{width:4,height:3,mimeType:"image/png"},adapters);
  const rendered=await loadImage(Buffer.from(await result.blob.arrayBuffer()));
  assert.equal(rendered.width,4); assert.equal(rendered.height,3); assert.equal(result.mimeType,"image/png");
});

test("JPEG export paints transparent pixels with the selected background",async()=>{
  const source=await pngImage(1,1,()=>{});
  const result=await processBitmap(source,{mimeType:"image/jpeg",quality:.95,background:"#ff0000"},adapters);
  const rendered=await loadImage(Buffer.from(await result.blob.arrayBuffer()));
  const canvas=createCanvas(1,1); const context=canvas.getContext("2d"); context.drawImage(rendered,0,0);
  const [red,green,blue]=context.getImageData(0,0,1,1).data;
  assert.equal(result.mimeType,"image/jpeg"); assert.ok(red>240); assert.ok(green<15); assert.ok(blue<15);
});

test("JPEG image data can be converted into a valid PNG",async()=>{
  const source=await pngImage(12,8,context=>{context.fillStyle="#2166cc";context.fillRect(0,0,12,8);});
  const jpegCanvas=createCanvas(12,8); jpegCanvas.getContext("2d").drawImage(source,0,0);
  const decoded=await loadImage(await jpegCanvas.encode("jpeg",{quality:.9}));
  const result=await processBitmap(decoded,{mimeType:"image/png"},adapters);
  const png=Buffer.from(await result.blob.arrayBuffer());
  assert.equal(result.mimeType,"image/png"); assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal((await loadImage(png)).width,12);
});

test("lower JPEG quality produces a smaller encoded result for detailed images",async()=>{
  const source=await pngImage(256,256,context=>{
    const pixels=context.createImageData(256,256);
    for(let y=0;y<256;y++) for(let x=0;x<256;x++) { const i=(y*256+x)*4; pixels.data[i]=(x*37+y*17)%256; pixels.data[i+1]=(x*13+y*53)%256; pixels.data[i+2]=(x*71+y*7)%256; pixels.data[i+3]=255; }
    context.putImageData(pixels,0,0);
  });
  const low=await processBitmap(source,{mimeType:"image/jpeg",quality:.2},adapters);
  const high=await processBitmap(source,{mimeType:"image/jpeg",quality:.95},adapters);
  assert.ok(low.blob.size<high.blob.size,`${low.blob.size} should be smaller than ${high.blob.size}`);
});

test("compressor preserves the source MIME for JPEG, PNG transparency, and WebP",async(t)=>{
  const createFixture=async(width,height,format,paint)=>{
    const canvas=createCanvas(width,height); paint(canvas.getContext("2d"));
    const sourceBytes=format==="image/webp"?await canvas.encode("webp",85):format==="image/jpeg"?await canvas.encode("jpeg",85):await canvas.encode("png");
    const extension=format==="image/jpeg"?"jpg":format==="image/png"?"png":"webp";
    const file=new File([sourceBytes],`fixture.${extension}`,{type:format});
    const decoded=await loadImage(sourceBytes);
    return {file,decoded,sourceBytes};
  };
  const detailed=(context,width,height)=>{
    const pixels=context.createImageData(width,height);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){const i=(y*width+x)*4;pixels.data[i]=(x*37+y*17)%256;pixels.data[i+1]=(x*13+y*53)%256;pixels.data[i+2]=(x*71+y*7)%256;pixels.data[i+3]=255;}
    context.putImageData(pixels,0,0);
  };
  const cases=[
    {name:"JPEG",type:"image/jpeg",width:24,height:16,paint:context=>detailed(context,24,16),qualities:[.7,.85,1]},
    {name:"large JPEG",type:"image/jpeg",width:1024,height:768,paint:context=>detailed(context,1024,768),qualities:[.7,.85,1]},
    {name:"transparent PNG",type:"image/png",width:32,height:32,paint:context=>{context.fillStyle="rgba(20,120,220,.5)";context.fillRect(4,5,12,14);},qualities:null},
    {name:"unusual wide WebP",type:"image/webp",width:8192,height:1,paint:context=>detailed(context,8192,1),qualities:[.75,.9,1]},
  ];
  for(const sample of cases){
    const {file,decoded}=await createFixture(sample.width,sample.height,sample.type,sample.paint);
    assert.equal(await validateImageFileContent(file),sample.type.replace("image/",""));
    const output=sample.qualities
      ? await processBitmapAtQualities(decoded,{mimeType:sample.type},sample.qualities,adapters)
      : await processBitmap(decoded,{mimeType:sample.type},adapters);
    assert.equal(output.mimeType,sample.type); assert.equal(output.width,sample.width); assert.equal(output.height,sample.height);
    t.diagnostic(`${sample.name}: ${file.size} → ${output.blob.size} bytes (${calculateSizeReduction(file.size,output.blob.size).toFixed(2)}% reduction)`);
    if(sample.type==="image/png"){
      const resultImage=await loadImage(Buffer.from(await output.blob.arrayBuffer()));
      const resultCanvas=createCanvas(resultImage.width,resultImage.height); const context=resultCanvas.getContext("2d");context.drawImage(resultImage,0,0);
      assert.ok(context.getImageData(8,9,1,1).data[3]<255,"PNG alpha must survive re-encoding");
    }
  }
});

test("compressor identifies an already-optimized JPEG that grows at the selected quality",async(t)=>{
  const canvas=createCanvas(512,512); const context=canvas.getContext("2d"); const pixels=context.createImageData(512,512);
  for(let y=0;y<512;y++) for(let x=0;x<512;x++){const i=(y*512+x)*4;pixels.data[i]=(x*37+y*17)%256;pixels.data[i+1]=(x*13+y*53)%256;pixels.data[i+2]=(x*71+y*7)%256;pixels.data[i+3]=255;}
  context.putImageData(pixels,0,0);
  const originalBytes=await canvas.encode("jpeg",5); const decoded=await loadImage(originalBytes);
  const output=await processBitmapAtQualities(decoded,{mimeType:"image/jpeg"},[.78,.88,.98,1],adapters);
  const reduction=calculateSizeReduction(originalBytes.length,output.blob.size);
  t.diagnostic(`already-optimized JPEG: ${originalBytes.length} → ${output.blob.size} bytes (${reduction.toFixed(2)}% reduction)`);
  assert.equal(output.mimeType,"image/jpeg"); assert.ok(output.blob.size>originalBytes.length); assert.ok(reduction<0);
});

test("quality ladder is explicit, includes the selected minimum, and rejects invalid values",()=>{
  assert.deepEqual(getCompressionQualities(.82),[.82,.85,.9,.95,1]);
  assert.deepEqual(getCompressionQualities(.75),[.75,.8,.85,.9,.95,1]);
  assert.deepEqual(getPngOptimizationLevels(2),[2,3,4]);
  assert.throws(()=>getCompressionQualities(.05),/between 50% and 100%/);
  assert.throws(()=>getPngOptimizationLevels(5),/from 1 to 4/);
});

test("compressor selects the smallest eligible JPEG candidate and retains original if none wins",async()=>{
  const bitmap={width:20,height:10};
  const original=new File([new Uint8Array(100)],"source.jpg",{type:"image/jpeg"});
  const adapters={createCanvas:()=>({getContext:()=>({drawImage(){}})}),encode:async(_canvas,_mime,quality)=>new Blob([new Uint8Array(Math.round(quality*100))],{type:"image/jpeg"})};
  const testAdapters={createCanvas:()=>({getContext:()=>({drawImage(){},getImageData:()=>({width:20,height:10,data:new Uint8ClampedArray(800)})})}),encodeCandidates:async(_imageData,{qualities})=>qualities.map(quality=>({blob:new Blob([new Uint8Array(Math.round(quality*100))],{type:"image/jpeg"}),quality}))};
  const selected=await compressImage(bitmap,original,{format:"jpeg",minimumQuality:.75,adapters:testAdapters});
  assert.equal(selected.qualityUsed,.75); assert.equal(selected.blob.size,75); assert.equal(selected.originalRetained,false);
  const retained=await compressImage(bitmap,original,{format:"jpeg",minimumQuality:.9,adapters:{...testAdapters,encodeCandidates:async()=>[{blob:new Blob([new Uint8Array(120)],{type:"image/jpeg"}),quality:.9}]}});
  assert.equal(retained.blob,original); assert.equal(retained.originalRetained,true); assert.equal(retained.mimeType,"image/jpeg");
});

test("PNG optimizer retains original when no candidate is smaller and explicit WebP conversion preserves dimensions",async()=>{
  const transparent=await pngImage(36,28,context=>{context.fillStyle="rgba(20,120,220,.5)";context.fillRect(4,5,12,14);});
  const sourceCanvas=createCanvas(36,28); sourceCanvas.getContext("2d").drawImage(transparent,0,0);
  const pngBytes=await sourceCanvas.encode("png");
  const original=new File([pngBytes],"transparent.png",{type:"image/png"});
  const retained=await compressImage(transparent,original,{format:"png",adapters:{optimizePng:async()=>[{blob:new Blob([new Uint8Array(original.size+1)],{type:"image/png"}),level:2}]}});
  assert.equal(retained.blob,original); assert.equal(retained.originalRetained,true);
  const largeCanvas=createCanvas(400,300); const largeContext=largeCanvas.getContext("2d");
  const imageData=largeContext.createImageData(400,300);
  for(let i=0;i<imageData.data.length;i+=4){const value=(i*73+i/4*19)%256;imageData.data[i]=value;imageData.data[i+1]=(value*3)%256;imageData.data[i+2]=(value*7)%256;imageData.data[i+3]=255;}
  largeContext.putImageData(imageData,0,0);
  const largePngBytes=await largeCanvas.encode("png"); const largeOriginal=new File([largePngBytes],"large.png",{type:"image/png"});
  const largeBitmap=await loadImage(largePngBytes);
  const converted=await compressImage(largeBitmap,largeOriginal,{format:"png",outputFormat:"webp",minimumQuality:.75,adapters:codecAdapters});
  assert.equal(converted.mimeType,"image/webp"); assert.equal(converted.originalRetained,false); assert.equal(converted.width,400); assert.equal(converted.height,300);
  const decoded=await loadImage(Buffer.from(await converted.blob.arrayBuffer()));
  assert.equal(decoded.width,400); assert.equal(decoded.height,300);
});

test("all supported explicit format conversions return matching MIME, extension, and dimensions",async()=>{
  const formats=["jpeg","png","webp"];
  const canvas=createCanvas(192,128); const context=canvas.getContext("2d");
  const data=context.createImageData(192,128);
  for(let i=0;i<data.data.length;i+=4){const n=(i*31+i/4*17)%256;data.data[i]=n;data.data[i+1]=(n*5)%256;data.data[i+2]=(n*11)%256;data.data[i+3]=255;}
  context.putImageData(data,0,0);
  console.log("Format matrix | input -> output | original bytes | output bytes | saved (%)");
  for(const inputFormat of formats){
    const inputBytes=inputFormat==="jpeg"?await canvas.encode("jpeg",85):inputFormat==="webp"?await canvas.encode("webp",85):await canvas.encode("png");
    const ext=getImageExtensionFromMime(`image/${inputFormat}`);
    const file=new File([inputBytes],`matrix.${ext}`,{type:`image/${inputFormat}`});
    const bitmap=await loadImage(inputBytes);
    for(const outputFormat of formats){
      const result=await compressImage(bitmap,file,{format:inputFormat,outputFormat,minimumQuality:.75,background:"#234567",adapters:codecAdapters});
      assert.equal(result.mimeType,`image/${outputFormat}`,`${inputFormat} to ${outputFormat} MIME`);
      assert.equal(getImageExtensionFromMime(result.mimeType),outputFormat==="jpeg"?"jpg":outputFormat);
      assert.equal(result.width,192); assert.equal(result.height,128);
      const decoded=await loadImage(Buffer.from(await result.blob.arrayBuffer()));
      assert.equal(decoded.width,192); assert.equal(decoded.height,128);
      assert.equal(result.converted,inputFormat!==outputFormat);
      console.log(`${inputFormat} -> ${outputFormat} | ${file.size} | ${result.blob.size} | ${calculateSizeReduction(file.size,result.blob.size).toFixed(2)}%`);
    }
    bitmap.close?.();
  }
});

test("transparent PNG to JPEG uses the selected background color",async()=>{
  const source=await pngImage(8,8,context=>{context.fillStyle="rgba(240,20,20,.5)";context.fillRect(4,4,2,2);});
  const sourceCanvas=createCanvas(8,8); sourceCanvas.getContext("2d").drawImage(source,0,0);
  const bytes=await sourceCanvas.encode("png"); const file=new File([bytes],"alpha.png",{type:"image/png"});
  const result=await compressImage(source,file,{format:"png",outputFormat:"jpeg",minimumQuality:.9,background:"#2040c0",adapters:codecAdapters});
  assert.equal(result.mimeType,"image/jpeg");
  const decoded=await loadImage(Buffer.from(await result.blob.arrayBuffer()));
  const outCanvas=createCanvas(8,8); const outContext=outCanvas.getContext("2d");outContext.drawImage(decoded,0,0);
  const [red,green,blue]=outContext.getImageData(0,0,1,1).data;
  assert.ok(red<60&&green<90&&blue>140,`background pixel should be blue, got ${red},${green},${blue}`);

  const webpCanvas=createCanvas(8,8); webpCanvas.getContext("2d").drawImage(source,0,0);
  const webpBytes=await webpCanvas.encode("webp",90); const webpFile=new File([webpBytes],"alpha.webp",{type:"image/webp"});
  const webpSource=await loadImage(webpBytes);
  const webpJpeg=await compressImage(webpSource,webpFile,{format:"webp",outputFormat:"jpeg",minimumQuality:.9,background:"#2040c0",adapters:codecAdapters});
  assert.equal(webpJpeg.mimeType,"image/jpeg");
  const webpJpegImage=await loadImage(Buffer.from(await webpJpeg.blob.arrayBuffer()));
  const webpOutCanvas=createCanvas(8,8); webpOutCanvas.getContext("2d").drawImage(webpJpegImage,0,0);
  const [webpRed,webpGreen,webpBlue]=webpOutCanvas.getContext("2d").getImageData(0,0,1,1).data;
  assert.ok(webpRed<60&&webpGreen<90&&webpBlue>140,`WebP background pixel should be blue, got ${webpRed},${webpGreen},${webpBlue}`);
});

test("explicit conversions are returned even when larger than the source",async()=>{
  const bitmap={width:20,height:10}; const original=new File([new Uint8Array(10)],"tiny.png",{type:"image/png"});
  const result=await compressImage(bitmap,original,{format:"png",outputFormat:"jpeg",background:"#ffffff",adapters:{createCanvas:()=>({getContext:()=>({fillRect(){},drawImage(){},getImageData:()=>({width:20,height:10,data:new Uint8ClampedArray(800)})})}),encodeCandidates:async()=>[{blob:new Blob([new Uint8Array(100)],{type:"image/jpeg"}),quality:.8}]}});
  assert.equal(result.mimeType,"image/jpeg"); assert.equal(result.converted,true); assert.equal(result.originalRetained,false); assert.equal(result.blob.size,100);
  assert.ok(calculateSizeReduction(original.size,result.blob.size)<0);
});

test("realistic image fixtures report actual bytes, dimensions, format, retention, and decodability",async(t)=>{
  // Photo-like gradients plus deterministic fine grain produce realistic encoder work without a downloaded asset.
  const photo=(context,width,height,grain=18)=>{
    const pixels=context.createImageData(width,height);
    let seed=9173;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      seed=(seed*16807)%2147483647; const noise=(seed/2147483647-.5)*grain;
      const i=(y*width+x)*4; const light=(.25+.55*y/height)*255 + noise;
      pixels.data[i]=Math.max(0,Math.min(255,light*.92+x/width*24));
      pixels.data[i+1]=Math.max(0,Math.min(255,light*.78+y/height*38));
      pixels.data[i+2]=Math.max(0,Math.min(255,light*.62+Math.sin(x/47)*9)); pixels.data[i+3]=255;
    }
    context.putImageData(pixels,0,0);
  };
  const fixture=async({name,width,height,format,quality=85,paint=photo})=>{
    const canvas=createCanvas(width,height); paint(canvas.getContext("2d"),width,height);
    const bytes=format==="jpeg"?await canvas.encode("jpeg",quality):format==="webp"?await canvas.encode("webp",quality):await canvas.encode("png");
    const mime=`image/${format}`; const extension=format==="jpeg"?"jpg":format;
    return new File([bytes],`${name}.${extension}`,{type:mime});
  };
  const optimizedCanvas=createCanvas(512,512);photo(optimizedCanvas.getContext("2d"),512,512);
  const optimizedBytes=await jpegEncoder.default(optimizedCanvas.getContext("2d").getImageData(0,0,512,512),{quality:75});
  const optimizedJpeg=new File([optimizedBytes],"already-optimized.jpg",{type:"image/jpeg"});
  const screenshot=await fixture({name:"text-screenshot",width:720,height:440,format:"png",paint:context=>{
    context.fillStyle="#fff";context.fillRect(0,0,720,440);context.fillStyle="#16324f";context.fillRect(0,0,720,68);
    context.fillStyle="#fff";context.font="bold 24px sans-serif";context.fillText("Project notes",28,44);
    context.fillStyle="#27364b";context.font="16px sans-serif";context.fillText("Review the image compression results before sharing.",32,118);
    context.strokeStyle="#cbd5e1";context.strokeRect(28,145,660,230);context.fillStyle="#2563eb";context.fillRect(48,170,180,42);context.fillStyle="#fff";context.fillText("Export report",64,197);
    context.fillStyle="#64748b";context.fillText("PNG screenshot with crisp interface text",48,264);
  }});
  const limitedPalette=await fixture({name:"limited-palette",width:480,height:320,format:"png",paint:(context,width,height)=>{
    const colors=["#1d3557","#457b9d","#a8dadc","#f1faee","#e63946","#ffb703"];
    for(let y=0;y<height;y+=20)for(let x=0;x<width;x+=20){context.fillStyle=colors[(Math.floor(x/20)+Math.floor(y/20))%colors.length];context.fillRect(x,y,20,20);}
  }});
  const cases=[
    {name:"Large JPEG photo-like",file:await fixture({name:"large-photo",width:1600,height:1200,format:"jpeg",quality:92}),format:"jpeg"},
    {name:"Small JPEG",file:await fixture({name:"small",width:96,height:64,format:"jpeg",quality:82}),format:"jpeg"},
    {name:"Already optimized JPEG",file:optimizedJpeg,format:"jpeg"},
    {name:"Transparent PNG",file:await fixture({name:"alpha",width:256,height:192,format:"png",paint:(ctx)=>{ctx.fillStyle="rgba(10,90,220,.45)";ctx.beginPath();ctx.arc(100,90,60,0,Math.PI*2);ctx.fill();}}),format:"png"},
    {name:"Large PNG photo-like",file:await fixture({name:"large-png",width:1000,height:750,format:"png"}),format:"png"},
    {name:"Text screenshot PNG",file:screenshot,format:"png"},
    {name:"Limited palette PNG",file:limitedPalette,format:"png"},
    {name:"Small WebP",file:await fixture({name:"small-webp",width:96,height:64,format:"webp",quality:82}),format:"webp"},
    {name:"Large WebP",file:await fixture({name:"large-webp",width:1200,height:900,format:"webp",quality:92}),format:"webp"},
    {name:"Unusual dimensions",file:await fixture({name:"wide",width:8192,height:1,format:"webp",quality:90}),format:"webp"},
  ];
  t.diagnostic("Fixture | original format/bytes/dimensions | output format/bytes/dimensions | setting | savings | original retained");
  for(const sample of cases){
    assert.equal(await validateImageFileContent(sample.file),sample.format);
    const bitmap=await loadImage(Buffer.from(await sample.file.arrayBuffer()));
    const result=await compressImage(bitmap,sample.file,{format:sample.format,minimumQuality:.75,adapters:codecAdapters});
    const outputFormat=result.mimeType.replace("image/","");
    const outputBytes=result.blob.size;
    const outputImage=await loadImage(Buffer.from(await result.blob.arrayBuffer()));
    const saved=Math.max(0,calculateSizeReduction(sample.file.size,outputBytes));
    const setting=sample.format==="png"?`PNG level ${result.optimizationLevel??"retained"}`:`quality ${result.qualityUsed==null?"retained":Math.round(result.qualityUsed*100)}`;
    t.diagnostic(`${sample.name} | ${sample.format}/${sample.file.size}/${bitmap.width}x${bitmap.height} | ${outputFormat}/${outputBytes}/${outputImage.width}x${outputImage.height} | ${setting} | ${saved.toFixed(2)}% | ${result.originalRetained}`);
    assert.equal(outputFormat,sample.format); assert.equal(outputImage.width,bitmap.width); assert.equal(outputImage.height,bitmap.height);
    assert.ok(outputBytes<=sample.file.size,"compress workflow never returns a larger output");
    assert.equal(result.originalRetained,outputBytes===sample.file.size);
    if(sample.name==="Transparent PNG") {
      const transparencyCanvas=createCanvas(outputImage.width,outputImage.height);const transparencyContext=transparencyCanvas.getContext("2d");transparencyContext.drawImage(outputImage,0,0);
      assert.equal(transparencyContext.getImageData(0,0,1,1).data[3],0,"fully transparent pixels remain transparent");
      const alpha=transparencyContext.getImageData(100,90,1,1).data[3];assert.ok(alpha>0&&alpha<255,"partial transparency remains present");
    }
    bitmap.close?.();
  }
});

test("MIME and file-size calculations report growth as negative reduction",()=>{
  assert.equal(calculateSizeReduction(1000,750),25);
  assert.equal(calculateSizeReduction(1000,1250),-25);
  assert.throws(()=>calculateSizeReduction(0,1),/valid byte counts/);
});

test("image encoder rejects invalid output dimensions",async()=>{
  const source=await pngImage(1,1,()=>{});
  await assert.rejects(processBitmap(source,{width:0,height:1,mimeType:"image/png"},adapters),/positive whole numbers/);
});
