import test from "node:test";
import assert from "node:assert/strict";
import { filterTools } from "../lib/tool-search.mjs";

const tools = [
  { name: "Image Resizer", description: "Resize JPEG and PNG images", category: "image" },
  { name: "Merge PDF", description: "Combine PDF files", category: "pdf" },
  { name: "Word Counter", description: "Count writing length", category: "text" },
];

test("tool search returns all tools for empty or whitespace-only queries", () => {
  assert.deepEqual(filterTools(tools, ""), tools);
  assert.deepEqual(filterTools(tools, "   "), tools);
});

test("tool search filters case-insensitively across names, descriptions, and categories", () => {
  assert.deepEqual(filterTools(tools, "  IMAGE "), [tools[0]]);
  assert.deepEqual(filterTools(tools, "combine"), [tools[1]]);
  assert.deepEqual(filterTools(tools, "COUNTER"), [tools[2]]);
});

test("tool search returns an empty list when nothing matches", () => {
  assert.deepEqual(filterTools(tools, "calculator"), []);
});
