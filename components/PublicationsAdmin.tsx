"use client";
import { useState } from "react";
import { type Publication } from "@/lib/validation";
import { useAdminList } from "./useAdminList";
const blank = {
  kind: "Announcement" as "Announcement" | "Activity",
  title: "",
  body: "",
  eventDate: "",
  location: "",
  published: false,
};
export default function PublicationsAdmin() {
  const [form, setForm] = useState({ ...blank });
  const [id, setId] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const list = useAdminList<Publication>(
    "/api/admin/publications",
    page,
    "",
    revision,
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        id ? `/api/admin/publications/${id}` : "/api/admin/publications",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(
        form.published
          ? "Saved and published on the homepage."
          : "Saved as a draft. It is hidden from the homepage.",
      );
      setForm({ ...blank });
      setId("");
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save publication.");
    } finally {
      setBusy(false);
    }
  }
  function edit(p: Publication) {
    setId(p._id);
    setForm({
      kind: p.kind,
      title: p.title,
      body: p.body,
      eventDate: p.eventDate || "",
      location: p.location || "",
      published: p.published,
    });
    setError("");
    setMessage("");
    document
      .getElementById("publication-editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <>
      <section className="panel" id="publication-editor">
        <h2>{id ? "Edit publication" : "Activities & announcements"}</h2>
        <p>Publish church updates here, or keep them as drafts.</p>
        <form onSubmit={save}>
          <div className="form-grid">
            <label className="field">
              <span>Type</span>
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kind: e.target.value as "Announcement" | "Activity",
                  })
                }
              >
                <option>Announcement</option>
                <option>Activity</option>
              </select>
            </label>
            <label className="field">
              <span>Title</span>
              <input
                required
                minLength={2}
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Event date (optional)</span>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) =>
                  setForm({ ...form, eventDate: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Location (optional)</span>
              <input
                maxLength={200}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span>Details</span>
            <textarea
              required
              minLength={2}
              maxLength={5000}
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            Publish on the homepage
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          <div className="actions">
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save publication"}
            </button>
            {id && (
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setId("");
                  setForm({ ...blank });
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Saved publications</h2>
        {list.error && (
          <p className="error" role="alert">
            {list.error}
          </p>
        )}
        {list.loading ? (
          <p>Loading…</p>
        ) : list.records.length === 0 ? (
          <p>No publications yet.</p>
        ) : (
          <div className="admin-publications">
            {list.records.map((p) => (
              <article key={p._id}>
                <div>
                  <span className="tag">
                    {p.kind} · {p.published ? "Published" : "Draft"}
                  </span>
                  <h3>{p.title}</h3>
                  <p>
                    {p.eventDate} {p.location}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => edit(p)}
                >
                  Edit / change visibility
                </button>
              </article>
            ))}
          </div>
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
  );
}
