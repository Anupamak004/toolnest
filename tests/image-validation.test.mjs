import test from "node:test";
import assert from "node:assert/strict";
import { validateImageFile, validateImageFileContent, validateImageDimensions, formatBytes, IMAGE_LIMIT_BYTES } from "../lib/file-validation.mjs";

test("image validation accepts JPEG, PNG, and WebP from MIME or filename", () => {
  assert.equal(validateImageFile({ name: "photo.jpg", type: "image/jpeg", size: 10 }), "jpeg");
  assert.equal(validateImageFile({ name: "alpha.png", type: "", size: 10 }), "png");
  assert.equal(validateImageFile({ name: "banner.webp", type: "image/webp", size: 10 }), "webp");
});

test("image validation rejects unsupported, empty, oversized, and disallowed formats", () => {
  assert.throws(() => validateImageFile({ name: "animation.gif", type: "image/gif", size: 10 }), /supported/);
  assert.throws(() => validateImageFile({ name: "zero.png", type: "image/png", size: 0 }), /empty/);
  assert.throws(() => validateImageFile({ name: "large.webp", type: "image/webp", size: IMAGE_LIMIT_BYTES + 1 }), /20(?:\.0)? MB/);
  assert.throws(() => validateImageFile({ name: "photo.png", type: "image/png", size: 10 }, { formats: ["jpeg"] }), /JPEG/);
});

test("image content inspection rejects renamed invalid files and MIME/extension conflicts", async () => {
  const invalid=new File([new Uint8Array([1,2,3,4,5])],"fake.jpg",{type:"image/jpeg"});
  await assert.rejects(validateImageFileContent(invalid),/contents are not a supported/);
  const mismatch=new File([new Uint8Array([137,80,78,71,13,10,26,10])],"photo.jpg",{type:"image/png"});
  await assert.rejects(validateImageFileContent(mismatch),/MIME type indicates PNG/);
});

test("image output dimensions enforce integer, side, and total pixel limits", () => {
  assert.deepEqual(validateImageDimensions(240, 120), { width: 240, height: 120 });
  assert.throws(() => validateImageDimensions(0, 20), /positive whole numbers/);
  assert.throws(() => validateImageDimensions(10001, 1), /cannot exceed/);
  assert.throws(() => validateImageDimensions(8000, 6000), /too large/);
});

test("file size formatting is readable", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.match(formatBytes(1024 * 5), /5\.00 KB/);
});
