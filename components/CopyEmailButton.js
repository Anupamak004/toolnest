"use client";

import { useState } from "react";

export default function CopyEmailButton({ email }) {
  const [status, setStatus] = useState("");

  async function copyEmail() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(email);
      setStatus("Email copied.");
    } catch {
      setStatus("Could not copy automatically. Select the email address to copy it.");
    }
  }

  return <div className="copy-email-control">
    <button className="tool-button" type="button" onClick={copyEmail}>Copy email</button>
    <span className="copy-email-status" role="status" aria-live="polite">{status}</span>
  </div>;
}
