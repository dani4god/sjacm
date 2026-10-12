"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fullName,
  type AdminProfile,
  type ProfileInput,
} from "@/lib/validation";
import ProfileForm from "./ProfileForm";
import PublicationsAdmin from "./PublicationsAdmin";
import { useAdminList } from "./useAdminList";
export default function Dashboard({ name }: { name: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"registry" | "publications">("registry");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [edit, setEdit] = useState<AdminProfile | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<AdminProfile | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const list = useAdminList<AdminProfile>(
    "/api/admin/profiles",
    page,
    search,
    revision,
  );
  async function save(data: ProfileInput) {
    const res = await fetch(
      edit ? `/api/admin/profiles/${edit._id}` : "/api/admin/profiles",
      {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setSaved(result.record);
    setEdit(null);
    setFormKey((v) => v + 1);
    setRevision((v) => v + 1);
    setCopied("");
  }
  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error("Unable to sign out. Please try again.");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed.");
      setLoggingOut(false);
    }
  }
  async function copy(record: AdminProfile) {
    try {
      await navigator.clipboard.writeText(`Candidate name: ${fullName(record)}
Church code: ${record.churchCode}`);
      setCopied(record._id);
    } catch {
      setError(
        "Clipboard is unavailable. Copy the displayed name and code manually.",
      );
    }
  }
  function startEdit(record: AdminProfile) {
    setEdit(record);
    setSaved(null);
    setFormKey((v) => v + 1);
    document
      .getElementById("profile-editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <>
      <header className="nav">
        <Link className="brand" href="/">
          <span className="brand-cross" aria-hidden="true">
            ✝
          </span>
          <span>
            SJACM<small>Church administration</small>
          </span>
        </Link>
        <button className="secondary" disabled={loggingOut} onClick={logout}>
          {loggingOut ? "Signing out…" : "Logout"}
        </button>
      </header>
      <main className="dashboard">
        <span className="eyebrow">CHURCH OFFICE</span>
        <h1>Registry dashboard</h1>
        <p>Welcome, {name}. Manage member records and church updates.</p>
        <div className="tabs" role="group" aria-label="Dashboard sections">
          <button
            type="button"
            aria-pressed={tab === "registry"}
            className={tab === "registry" ? "primary" : "secondary"}
            onClick={() => setTab("registry")}
          >
            Church registry
          </button>
          <button
            type="button"
            aria-pressed={tab === "publications"}
            className={tab === "publications" ? "primary" : "secondary"}
            onClick={() => setTab("publications")}
          >
            Activities & announcements
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {tab === "registry" ? (
          <>
            {saved && (
              <section className="code-panel" aria-live="polite">
                <span className="eyebrow">PROFILE SAVED</span>
                <h2>{fullName(saved)}</h2>
                <p>Give the candidate this exact name and their church code.</p>
                <code>{saved.churchCode}</code>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => copy(saved)}
                >
                  {copied === saved._id ? "Copied" : "Copy name & code"}
                </button>
                <p className="small">
                  This code opens only this profile when the registered name
                  also matches. Keep it private.
                </p>
              </section>
            )}
            <section id="profile-editor" className="panel">
              <h2>{edit ? "Edit member profile" : "Create member profile"}</h2>
              {edit && (
                <p className="small">
                  Church code: {edit.churchCode}. Editing preserves this code.
                </p>
              )}
              <ProfileForm
                key={formKey}
                initial={edit}
                onSave={save}
                onCancel={() => {
                  setEdit(null);
                  setFormKey((v) => v + 1);
                }}
              />
            </section>
            <section className="panel">
              <h2>
                Saved registry profiles{" "}
                <span className="small">({list.total})</span>
              </h2>
              <form
                className="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(query.trim());
                  setPage(1);
                }}
              >
                <label className="sr-only" htmlFor="profile-search">
                  Registered name or church code
                </label>
                <input
                  id="profile-search"
                  maxLength={200}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Exact registered name or church code"
                />
                <button className="secondary">Search</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setQuery("");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear
                </button>
              </form>
              {list.error && (
                <p className="error" role="alert">
                  {list.error}
                </p>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Registered name</th>
                      <th>Church code</th>
                      <th>Baptized</th>
                      <th>Confirmed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.records.map((p) => (
                      <tr key={p._id}>
                        <td>{fullName(p)}</td>
                        <td>
                          <code>{p.churchCode}</code>
                        </td>
                        <td>{p.baptized ? "Yes" : "No"}</td>
                        <td>{p.confirmed ? "Yes" : "No"}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => startEdit(p)}
                            >
                              View / edit
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => copy(p)}
                            >
                              {copied === p._id ? "Copied" : "Copy code"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {list.loading ? (
                <p>Loading profiles…</p>
              ) : (
                list.records.length === 0 && <p>No matching profiles.</p>
              )}
              <div className="actions">
                <button
                  className="secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  className="secondary"
                  disabled={page * 20 >= list.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </section>
          </>
        ) : (
          <PublicationsAdmin />
        )}
      </main>
    </>
  );
}
