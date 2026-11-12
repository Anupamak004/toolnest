export const MAX_TEXT_CHARACTERS = 1000000;

export function getWordStats(input) {
  const text = String(input ?? "");
  if (text.length > MAX_TEXT_CHARACTERS) throw new Error(`Text is limited to ${MAX_TEXT_CHARACTERS.toLocaleString()} characters.`);
  const trimmed = text.trim();
  const words = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter(undefined,{granularity:"word"}).segment(text)).filter(part=>part.isWordLike).length
    : (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)||[]).length;
  const sentences = trimmed ? sentenceSegments(trimmed) : 0;
  const paragraphs = trimmed ? trimmed.split(/\r\n|\r|\n/u).filter(part => part.trim()).length : 0;
  const graphemes=typeof Intl.Segmenter === "function"?Array.from(new Intl.Segmenter(undefined,{granularity:"grapheme"}).segment(text),part=>part.segment):Array.from(text);
  return { words: typeof words==="number"?words:words.length, characters: graphemes.length, charactersWithoutSpaces: graphemes.filter(part=>!/^[\s\uFEFF]+$/u.test(part)).length, sentences, paragraphs };
}

function sentenceSegments(text) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
    return Array.from(segmenter.segment(text)).filter(part => /[\p{L}\p{N}]/u.test(part.segment)).length;
  }
  return (text.match(/[^.!?]+(?:[.!?]+["'’”)]*)?|[.!?]+/gu) || []).filter(part => /[\p{L}\p{N}]/u.test(part)).length;
}

export function convertCase(input, mode) {
  const text = String(input ?? "");
  if (!["uppercase", "lowercase", "title", "sentence"].includes(mode)) throw new Error("Choose uppercase, lowercase, title case, or sentence case.");
  if (mode === "uppercase") return text.toLocaleUpperCase();
  if (mode === "lowercase") return text.toLocaleLowerCase();
  const lower = text.toLocaleLowerCase();
  if (mode === "title") return lower.replace(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu, word => {const [first,...rest]=Array.from(word);return first.toLocaleUpperCase()+rest.join("");});
  return lower.replace(/(^|[.!?]+["'’”)]*\s+|\r\n|\r|\n+)(["'“‘(\[]*\s*)([\p{L}])/gu, (_, boundary, opening, letter) => boundary + opening + letter.toLocaleUpperCase());
}

export function removeDuplicateLines(input, { caseSensitive = true } = {}) {
  const source=String(input ?? "");
  if(source==="") return {text:"",removed:0,remaining:0};
  const lines = source.split(/\r\n|\n|\r/u);
  const seen = new Set(); const kept = []; let removed = 0;
  for (const line of lines) {
    const key = caseSensitive ? line : line.toLocaleLowerCase();
    if (seen.has(key)) { removed++; continue; }
    seen.add(key); kept.push(line);
  }
  return { text: kept.join("\n"), removed, remaining: kept.length };
}
