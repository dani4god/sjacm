"use client";
import { useId, useState } from "react";
import { type PublicProfile } from "@/lib/validation";
import { recordLines } from "@/lib/record-lines";
export default function RegistryLookup() {
  const prefix = useId();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [record, setRecord] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRecord(null);
    setBusy(true);
    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecord(data.record);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to check the registry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!record) return;
    setDownloading(true);
    setError("");
    try {
      const { createRegistryPdf } = await import("@/lib/pdf");
      const font = await fetch("/fonts/Registry.ttf");
      if (!font.ok) throw new Error("Unable to load PDF font.");
      const bytes = new Uint8Array(await font.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      createRegistryPdf(record, btoa(binary)).save(
        `SJACM-registry-${record.churchCode}.pdf`,
      );
    } catch {
      setError("Unable to download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }
  return (
    <>
      <p className="instruction">
        The candidate name and church code must match the details provided to
        the church in the registry. Enter the full name in{" "}
        <strong>Surname Firstname</strong> order. Letter case and extra spaces
        do not matter.
      </p>
      <form onSubmit={lookup}>
        <label htmlFor={`${prefix}-name`}>Candidate’s registered name</label>
        <input
          id={`${prefix}-name`}
          autoFocus
          required
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          placeholder="Surname Firstname"
          autoComplete="off"
        />
        <label htmlFor={`${prefix}-code`}>Church code</label>
        <input
          id={`${prefix}-code`}
          required
          value={code}
          minLength={12}
          maxLength={12}
          onChange={(e) => setCode(e.target.value)}
          placeholder="12 letters and numbers"
          autoComplete="off"
          spellCheck={false}
        />
        <button className="primary" disabled={busy}>
          {busy ? "Checking…" : "Find my church record"}
        </button>
      </form>
      <div aria-live="polite">
        {error && <p className="error">{error}</p>}
        {record && (
          <section className="registry-result">
            <span className="status">Matching church record found</span>
            <h3>Your registry details</h3>
            <dl>
              {recordLines(record).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              className="primary"
              onClick={download}
              disabled={downloading}
            >
              {downloading ? "Preparing PDF…" : "Download registry PDF"}
            </button>
            <p className="small">
              Keep your code private. Anyone with your registered name and code
              can access these details, including the priest’s comment.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
