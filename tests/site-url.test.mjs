import test from "node:test";
import assert from "node:assert/strict";
import { canonicalUrl, getSiteUrl } from "../lib/site-url.mjs";
import { getPublicPaths } from "../lib/public-routes.mjs";

test("site URL uses configured origin without inventing a production domain",()=>{
  assert.equal(getSiteUrl({NEXT_PUBLIC_SITE_URL:"https://tools.example.test/"}),"https://tools.example.test");
  assert.equal(getSiteUrl({}),"http://localhost:3000");
  assert.equal(canonicalUrl("/tools/image/image-compressor",{NEXT_PUBLIC_SITE_URL:"https://tools.example.test"}),"https://tools.example.test/tools/image/image-compressor");
  assert.throws(()=>getSiteUrl({NEXT_PUBLIC_SITE_URL:"not a url"}),/valid absolute URL/);
  assert.throws(()=>getSiteUrl({NEXT_PUBLIC_SITE_URL:"ftp://tools.example.test"}),/HTTP or HTTPS/);
  assert.throws(()=>getSiteUrl({NODE_ENV:"production"}),/Set NEXT_PUBLIC_SITE_URL/);
  assert.throws(()=>getSiteUrl({NODE_ENV:"production",NEXT_PUBLIC_SITE_URL:"http://tools.example.test"}),/HTTPS in production/);
  assert.equal(getSiteUrl({NODE_ENV:"production",NEXT_PUBLIC_SITE_URL:"https://tools.example.test"}),"https://tools.example.test");
});

test("public route inventory includes the 12 tools, guides, and trust pages once",()=>{
  const categories=[{slug:"image"},{slug:"pdf"},{slug:"text"}];
  const tools=[...categories.flatMap(category=>Array.from({length:category.slug==="image"?5:category.slug==="pdf"?4:3},(_,i)=>({category:category.slug,slug:`${category.slug}-${i}`})))];
  const guides=["compress-images-without-losing-quality","resize-images-online","merge-pdf-files","convert-jpg-to-png","choosing-image-format","clean-json","clear-writing"].map(slug=>({slug}));
  const infoPages={about:1,contact:1,privacy:1,terms:1,disclaimer:1};
  const paths=getPublicPaths({categories,tools,guides,infoPages});
  assert.equal(paths.length,30);
  assert.equal(new Set(paths).size,paths.length);
  assert.equal(paths.filter(path=>path.startsWith("/tools/")&&path.split("/").length===4).length,12);
  assert.ok(paths.includes("/guides/merge-pdf-files"));
  assert.ok(paths.includes("/privacy"));
  assert.ok(!paths.some(path=>path.startsWith("/tools/developer/")||path==="/tools/developer"));
});
