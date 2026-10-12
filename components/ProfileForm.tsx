"use client";
import { useState } from "react";
import {
  organizations,
  type ProfileInput,
  type AdminProfile,
} from "@/lib/validation";
type FormState = Omit<
  ProfileInput,
  "baptism" | "confirmation" | "marriage" | "churching"
> & {
  baptism: NonNullable<ProfileInput["baptism"]>;
  confirmation: NonNullable<ProfileInput["confirmation"]>;
  marriage: NonNullable<ProfileInput["marriage"]>;
  churching: NonNullable<ProfileInput["churching"]>;
};
const blank: FormState = {
  surname: "",
  firstName: "",
  baptized: false,
  baptism: {
    date: "",
    dateOfBirth: "",
    registerNumber: "",
    registerPage: "",
    parentsOrFormerReligion: "",
    sponsors: [""],
    residence: "",
    priest: "",
  },
  confirmed: false,
  confirmation: { date: "", place: "", priest: "" },
  hasOrganizations: false,
  organizations: [],
  married: false,
  marriage: { spouse: "", date: "", priests: [""] },
  churched: false,
  churching: { date: "", priest: "" },
  priestComment: "",
  commentPriest: "",
};
function Field({
  label,
  value,
  onChange,
  type = "text",
  max = 200,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  max?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={max}
        max={
          type === "date" ? new Date().toISOString().slice(0, 10) : undefined
        }
      />
    </label>
  );
}
function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="field yesno">
      <span>{label}</span>
      <select
        value={value ? "yes" : "no"}
        onChange={(e) => onChange(e.target.value === "yes")}
      >
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </label>
  );
}
function Names({
  label,
  values,
  onChange,
  max = 30,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  return (
    <div className="names">
      <span className="field-title">{label}</span>
      {values.map((name, index) => (
        <div className="name-row" key={index}>
          <label className="sr-only" htmlFor={`${label}-${index}`}>
            {label} {index + 1}
          </label>
          <input
            id={`${label}-${index}`}
            required
            maxLength={200}
            value={name}
            onChange={(e) =>
              onChange(values.map((v, i) => (i === index ? e.target.value : v)))
            }
          />
          <button
            type="button"
            className="secondary"
            disabled={values.length === 1}
            aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={values.length >= max}
        onClick={() => onChange([...values, ""])}
      >
        + Add another {label === "Sponsors" ? "sponsor" : "priest"}
      </button>
    </div>
  );
}
export default function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AdminProfile | null;
  onSave: (data: ProfileInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          surname: initial.surname,
          firstName: initial.firstName,
          baptized: initial.baptized,
          baptism: initial.baptism || { ...blank.baptism, sponsors: [""] },
          confirmed: initial.confirmed,
          confirmation: initial.confirmation || { ...blank.confirmation },
          hasOrganizations: initial.hasOrganizations,
          organizations: [...initial.organizations],
          married: initial.married,
          marriage: initial.marriage || { ...blank.marriage, priests: [""] },
          churched: initial.churched,
          churching: initial.churching || { ...blank.churching },
          priestComment: initial.priestComment,
          commentPriest: initial.commentPriest,
        }
      : structuredClone(blank),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data: ProfileInput = {
      ...form,
      baptism: form.baptized ? form.baptism : undefined,
      confirmation: form.confirmed ? form.confirmation : undefined,
      organizations: form.hasOrganizations ? form.organizations : [],
      marriage: form.married ? form.marriage : undefined,
      churching: form.churched ? form.churching : undefined,
    };
    try {
      await onSave(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="profile-form">
      <fieldset>
        <legend>Candidate details</legend>
        <div className="form-grid">
          <Field
            label="Surname"
            value={form.surname}
            onChange={(v) => setForm({ ...form, surname: v })}
          />
          <Field
            label="First name"
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
        </div>
        <p className="small">
          Lookup name: {form.surname || "Surname"}{" "}
          {form.firstName || "Firstname"}
        </p>
      </fieldset>
      <fieldset>
        <legend>Baptism</legend>
        <YesNo
          label="Baptized?"
          value={form.baptized}
          onChange={(v) => setForm({ ...form, baptized: v })}
        />
        {form.baptized && (
          <div className="conditional">
            <div className="form-grid">
              <Field
                label="Date of baptism"
                type="date"
                value={form.baptism.date}
                onChange={(v) =>
                  setForm({ ...form, baptism: { ...form.baptism, date: v } })
                }
              />
              <Field
                label="Date of birth"
                type="date"
                value={form.baptism.dateOfBirth}
                onChange={(v) =>
                  setForm({
                    ...form,
                    baptism: { ...form.baptism, dateOfBirth: v },
                  })
                }
              />
            </div>
            <div className="register-lines">
              <Field
                label="Number in register"
                value={form.baptism.registerNumber}
                onChange={(v) =>
                  setForm({
                    ...form,
                    baptism: { ...form.baptism, registerNumber: v },
                  })
                }
              />
              <Field
                label="Page in register"
                value={form.baptism.registerPage}
                onChange={(v) =>
                  setForm({
                    ...form,
                    baptism: { ...form.baptism, registerPage: v },
                  })
                }
              />
            </div>
            <Field
              label="Parents or former religion (for an adult)"
              value={form.baptism.parentsOrFormerReligion}
              onChange={(v) =>
                setForm({
                  ...form,
                  baptism: { ...form.baptism, parentsOrFormerReligion: v },
                })
              }
            />
            <Names
              label="Sponsors"
              values={form.baptism.sponsors}
              onChange={(v) =>
                setForm({ ...form, baptism: { ...form.baptism, sponsors: v } })
              }
            />
            <div className="form-grid">
              <Field
                label="Residence"
                value={form.baptism.residence}
                onChange={(v) =>
                  setForm({
                    ...form,
                    baptism: { ...form.baptism, residence: v },
                  })
                }
              />
              <Field
                label="By whom baptized (priest’s name)"
                value={form.baptism.priest}
                onChange={(v) =>
                  setForm({ ...form, baptism: { ...form.baptism, priest: v } })
                }
              />
            </div>
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Confirmation</legend>
        <YesNo
          label="Confirmation status?"
          value={form.confirmed}
          onChange={(v) => setForm({ ...form, confirmed: v })}
        />
        {form.confirmed && (
          <div className="conditional form-grid">
            <Field
              label="Date of confirmation"
              type="date"
              value={form.confirmation.date}
              onChange={(v) =>
                setForm({
                  ...form,
                  confirmation: { ...form.confirmation, date: v },
                })
              }
            />
            <Field
              label="Where confirmed"
              value={form.confirmation.place}
              onChange={(v) =>
                setForm({
                  ...form,
                  confirmation: { ...form.confirmation, place: v },
                })
              }
            />
            <Field
              label="By whom confirmed"
              value={form.confirmation.priest}
              onChange={(v) =>
                setForm({
                  ...form,
                  confirmation: { ...form.confirmation, priest: v },
                })
              }
            />
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Membership of organizations</legend>
        <YesNo
          label="Member of any organization?"
          value={form.hasOrganizations}
          onChange={(v) => setForm({ ...form, hasOrganizations: v })}
        />
        {form.hasOrganizations && (
          <div className="checkbox-grid">
            {organizations.map((org) => (
              <label key={org}>
                <input
                  type="checkbox"
                  checked={form.organizations.includes(org)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      organizations: e.target.checked
                        ? [...form.organizations, org]
                        : form.organizations.filter((v) => v !== org),
                    })
                  }
                />
                <span>{org}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Marriage</legend>
        <YesNo
          label="Was this member wedded in the church?"
          value={form.married}
          onChange={(v) => setForm({ ...form, married: v })}
        />
        {form.married && (
          <div className="conditional">
            <div className="form-grid">
              <Field
                label="To whom married"
                value={form.marriage.spouse}
                onChange={(v) =>
                  setForm({
                    ...form,
                    marriage: { ...form.marriage, spouse: v },
                  })
                }
              />
              <Field
                label="Date of wedding"
                type="date"
                value={form.marriage.date}
                onChange={(v) =>
                  setForm({ ...form, marriage: { ...form.marriage, date: v } })
                }
              />
            </div>
            <Names
              label="Officiating priests"
              values={form.marriage.priests}
              onChange={(v) =>
                setForm({ ...form, marriage: { ...form.marriage, priests: v } })
              }
              max={20}
            />
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Churching</legend>
        <YesNo
          label="Churching recorded?"
          value={form.churched}
          onChange={(v) => setForm({ ...form, churched: v })}
        />
        {form.churched && (
          <div className="conditional form-grid">
            <Field
              label="Date of churching"
              type="date"
              value={form.churching.date}
              onChange={(v) =>
                setForm({ ...form, churching: { ...form.churching, date: v } })
              }
            />
            <Field
              label="Officiating priest"
              value={form.churching.priest}
              onChange={(v) =>
                setForm({
                  ...form,
                  churching: { ...form.churching, priest: v },
                })
              }
            />
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Comment by priest</legend>
        <p className="small">
          This comment is included in the candidate’s registry lookup and
          download.
        </p>
        <label className="field">
          <span>Priest’s comment</span>
          <textarea
            required
            maxLength={4000}
            rows={5}
            value={form.priestComment}
            onChange={(e) =>
              setForm({ ...form, priestComment: e.target.value })
            }
          />
        </label>
        <Field
          label="Priest’s name"
          value={form.commentPriest}
          onChange={(v) => setForm({ ...form, commentPriest: v })}
        />
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="primary" disabled={busy}>
          {busy
            ? "Saving…"
            : initial
              ? "Save profile changes"
              : "Save & generate church code"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          {initial ? "Cancel edit" : "Clear form"}
        </button>
      </div>
    </form>
  );
}
