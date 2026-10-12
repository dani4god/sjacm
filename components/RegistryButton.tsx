"use client";
import { useRef, useState } from "react";
import RegistryLookup from "./RegistryLookup";
export default function RegistryButton({ nav = false }: { nav?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [lookupKey, setLookupKey] = useState(0);
  return (
    <>
      <button
        type="button"
        className={nav ? "nav-registry" : "primary"}
        onClick={() => dialog.current?.showModal()}
      >
        {nav ? "Church registry" : "Verify a church record"}
        {!nav && <span aria-hidden="true">↗</span>}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setLookupKey((v) => v + 1)}
        aria-labelledby={nav ? "registry-nav" : "registry-hero"}
      >
        <button
          type="button"
          className="close"
          aria-label="Close registry"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <h2 id={nav ? "registry-nav" : "registry-hero"}>Church registry</h2>
        <RegistryLookup key={lookupKey} />
      </dialog>
    </>
  );
}
