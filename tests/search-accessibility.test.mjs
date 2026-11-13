import test from "node:test";
import assert from "node:assert/strict";
import { getNextSearchOptionIndex, getSearchComboboxProps } from "../lib/search-accessibility.mjs";
import { getCategoryBrowseLabel } from "../lib/category-label.mjs";

test("search input exposes combobox semantics linked to its persistent listbox", () => {
  assert.deepEqual(getSearchComboboxProps({ hasOptions: false }), {
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-expanded": false,
    "aria-controls": "tool-search-results",
  });
  assert.deepEqual(getSearchComboboxProps({ hasOptions: true, activeOptionId: "tool-option-merge-pdf" }), {
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-expanded": true,
    "aria-controls": "tool-search-results",
    "aria-activedescendant": "tool-option-merge-pdf",
  });
});

test("search suggestion navigation wraps with Arrow Up and Arrow Down", () => {
  assert.equal(getNextSearchOptionIndex(-1, "ArrowDown", 3), 0);
  assert.equal(getNextSearchOptionIndex(2, "ArrowDown", 3), 0);
  assert.equal(getNextSearchOptionIndex(0, "ArrowUp", 3), 2);
  assert.equal(getNextSearchOptionIndex(1, "Enter", 3), 1);
  assert.equal(getNextSearchOptionIndex(0, "ArrowDown", 0), -1);
});

test("category browse labels distinguish their destinations", () => {
  assert.equal(getCategoryBrowseLabel("Image Tools"), "Browse image tools");
  assert.equal(getCategoryBrowseLabel("PDF Tools"), "Browse PDF tools");
  assert.equal(getCategoryBrowseLabel("Text Tools"), "Browse text tools");
});
