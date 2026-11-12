import test from "node:test";
import assert from "node:assert/strict";
import { convertCase, getWordStats, MAX_TEXT_CHARACTERS, removeDuplicateLines } from "../lib/text-processors.mjs";

test("word counter measures words, whitespace, sentences, and paragraphs", () => {
  assert.deepEqual(getWordStats("Hello, world!\n\nA café is fine."), { words: 6, characters: 30, charactersWithoutSpaces: 24, sentences: 2, paragraphs: 2 });
  assert.deepEqual(getWordStats(""), { words: 0, characters: 0, charactersWithoutSpaces: 0, sentences: 0, paragraphs: 0 });
  assert.equal(getWordStats("Don't stop—go").words, 3);
  assert.equal(getWordStats("🙂").characters, 1);
  assert.equal(getWordStats("  two    words  ").words, 2);
  assert.equal(getWordStats("line one\nline two\n\nline three").paragraphs, 3);
  assert.equal(getWordStats("你好世界").words, 2);
  assert.equal(getWordStats("สวัสดีครับ مرحبا بالعالم").words, 4);
  assert.equal(getWordStats("👩🏽‍💻").characters, 1);
  assert.equal(getWordStats("Hi!!! Are you well?\nYes.").sentences, 3);
  assert.throws(() => getWordStats("a".repeat(MAX_TEXT_CHARACTERS + 1)), /limited to/);
});

test("case converter supports upper, lower, title, and sentence case", () => {
  assert.equal(convertCase("Hi, THERE!", "uppercase"), "HI, THERE!");
  assert.equal(convertCase("Hi, THERE!", "lowercase"), "hi, there!");
  assert.equal(convertCase("hELLO wORLD—IT'S FINE", "title"), "Hello World—It's Fine");
  assert.equal(convertCase("hELLO WORLD. nEXT LINE! yes", "sentence"), "Hello world. Next line! Yes");
  assert.equal(convertCase("hELLO\nnEXT LINE!\n\nthird", "sentence"), "Hello\nNext line!\n\nThird");
  assert.equal(convertCase("hELLO.\n\"nEXT\"!", "sentence"), "Hello.\n\"Next\"!");
  assert.throws(() => convertCase("text", "camelCase"), /Choose/);
});

test("duplicate line removal preserves first occurrence and both comparison modes", () => {
  assert.deepEqual(removeDuplicateLines("Alpha\nbeta\nAlpha\n"), { text: "Alpha\nbeta\n", removed: 1, remaining: 3 });
  assert.deepEqual(removeDuplicateLines("Alpha\nalpha\nALPHA", { caseSensitive: false }), { text: "Alpha", removed: 2, remaining: 1 });
  assert.deepEqual(removeDuplicateLines("first\n\nsecond\n\n"), { text: "first\n\nsecond", removed: 2, remaining: 3 });
  assert.deepEqual(removeDuplicateLines(""), { text: "", removed: 0, remaining: 0 });
  assert.deepEqual(removeDuplicateLines("line\n line\nline"), { text: "line\n line", removed: 1, remaining: 2 });
});
