"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { convertCase, getWordStats, MAX_TEXT_CHARACTERS, removeDuplicateLines } from "../../lib/text-processors.mjs";

function useTextUrl(value) {
  const blob = useMemo(() => new Blob([value], { type: "text/plain;charset=utf-8" }), [value]);
  const [url, setUrl] = useState("");
  useEffect(() => { const next=URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); },[blob]);
  return url;
}

function TextInput({ value, onChange, label = "Enter or paste text", id = "tool-text-input" }) {
  return <label className="tool-control" htmlFor={id}>{label}<textarea id={id} value={value} maxLength={MAX_TEXT_CHARACTERS} onChange={event=>onChange(event.target.value)} placeholder="Start typing or paste text here…" /><small>{value.length.toLocaleString()} / {MAX_TEXT_CHARACTERS.toLocaleString()} characters · text is processed in this browser</small></label>;
}

function WordCounter() {
  const [text,setText]=useState("");
  const stats=useMemo(()=>getWordStats(text),[text]);
  return <div className="tool-form"><TextInput value={text} onChange={setText} /><div className="result-stats" aria-live="polite">{[["Words",stats.words],["Characters",stats.characters],["Characters without whitespace",stats.charactersWithoutSpaces],["Sentences",stats.sentences],["Paragraphs",stats.paragraphs]].map(([label,value])=><div className="stat-card" key={label}><strong>{value.toLocaleString()}</strong><span>{label}</span></div>)}</div><p className="hint">Word boundaries follow Unicode text segmentation. Contractions count as one word; each non-empty line counts as a paragraph.</p></div>;
}

function CaseConverter() {
  const [text,setText]=useState(""); const [mode,setMode]=useState("uppercase"); const [status,setStatus]=useState(""); const [statusIsError,setStatusIsError]=useState(false);
  const output=useMemo(()=>convertCase(text,mode),[text,mode]); const url=useTextUrl(output);
  async function copy() {
    setStatus(""); setStatusIsError(false);
    try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable. Select and copy the result manually."); await navigator.clipboard.writeText(output); setStatus("Copied to clipboard."); }
    catch(error) { setStatus(error.message || "Could not copy the result."); setStatusIsError(true); }
  }
  function changeMode(next) { setMode(next); setStatus(""); setStatusIsError(false); }
  return <div className="tool-form"><TextInput value={text} onChange={value=>{setText(value);setStatus("");setStatusIsError(false);}} />
    <fieldset className="case-options"><legend>Convert to</legend>{[["uppercase","UPPERCASE"],["lowercase","lowercase"],["title","Title Case"],["sentence","Sentence case"]].map(([value,label])=><button type="button" key={value} className={`tool-button${mode===value?" selected":""}`} aria-pressed={mode===value} onClick={()=>changeMode(value)}>{label}</button>)}</fieldset>
    <label className="tool-control" htmlFor="converted-text">Result<textarea id="converted-text" value={output} readOnly aria-live="polite" /></label>
    <div className="button-row"><button type="button" className="tool-button" onClick={copy}><Copy size={15} /> Copy result</button><a className="tool-button" href={url || undefined} download="converted-text.txt"><Download size={15} /> Download .txt</a></div>
    {status && <p className={statusIsError?"notice error":"notice success"} role={statusIsError?"alert":"status"}>{!statusIsError&&<Check size={14} />} {status}</p>}
  </div>;
}

function DuplicateLines() {
  const [text,setText]=useState(""); const [caseSensitive,setCaseSensitive]=useState(true); const [status,setStatus]=useState(""); const [statusIsError,setStatusIsError]=useState(false);
  const result=useMemo(()=>removeDuplicateLines(text,{caseSensitive}),[text,caseSensitive]); const url=useTextUrl(result.text);
  async function copy() {
    setStatus(""); setStatusIsError(false);
    try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable. Select and copy the result manually."); await navigator.clipboard.writeText(result.text); setStatus("Cleaned text copied to clipboard."); }
    catch(error) { setStatus(error.message || "Could not copy the result."); setStatusIsError(true); }
  }
  return <div className="tool-form"><TextInput value={text} onChange={value=>{setText(value);setStatus("");setStatusIsError(false);}} />
    <label className="check-row"><input type="checkbox" checked={caseSensitive} onChange={event=>{setCaseSensitive(event.target.checked);setStatus("");setStatusIsError(false);}} /> Case-sensitive comparison</label>
    <div className="result-stats"><div className="stat-card"><strong>{result.removed.toLocaleString()}</strong><span>Duplicate lines removed</span></div><div className="stat-card"><strong>{result.remaining.toLocaleString()}</strong><span>Lines kept</span></div></div>
    <label className="tool-control" htmlFor="deduplicated-text">Cleaned text<textarea id="deduplicated-text" value={result.text} readOnly /></label><p className="hint">Whitespace is significant. Repeated blank lines are collapsed; a blank input contains zero lines.</p>
    <div className="button-row"><button type="button" className="tool-button" onClick={copy}><Copy size={15} /> Copy result</button><a className="tool-button" href={url || undefined} download="deduplicated-lines.txt"><Download size={15} /> Download .txt</a></div>
    {status && <p className={statusIsError?"notice error":"notice success"} role={statusIsError?"alert":"status"}>{!statusIsError&&<Check size={14} />} {status}</p>}
  </div>;
}

export default function TextTools({ slug }) {
  if (slug === "word-counter") return <WordCounter />;
  if (slug === "case-converter") return <CaseConverter />;
  if (slug === "remove-duplicate-lines") return <DuplicateLines />;
  return null;
}
