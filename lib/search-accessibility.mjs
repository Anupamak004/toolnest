export function getSearchComboboxProps({ hasOptions, activeOptionId }) {
  return {
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-expanded": hasOptions,
    "aria-controls": "tool-search-results",
    ...(activeOptionId ? { "aria-activedescendant": activeOptionId } : {}),
  };
}

export function getNextSearchOptionIndex(currentIndex, key, optionCount) {
  if (optionCount < 1) return -1;
  if (key === "ArrowDown") return (currentIndex + 1) % optionCount;
  if (key === "ArrowUp") return (currentIndex - 1 + optionCount) % optionCount;
  return currentIndex;
}
