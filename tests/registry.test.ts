import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  profileInput,
  lookupInput,
  normalizeName,
  publicationInput,
  type PublicProfile,
} from "../lib/validation";
import { generateCode, publicRecord } from "../lib/registry";
import { recordLines } from "../lib/record-lines";
import { createRegistryPdf } from "../lib/pdf";
const minimal = {
  surname: "Okeke",
  firstName: "Daniel",
  baptized: false,
  confirmed: false,
  hasOrganizations: false,
  organizations: [],
  married: false,
  churched: false,
  priestComment: "Member in good standing.",
  commentPriest: "Revd Demo",
};
test("a No section needs no corresponding details", () => {
  const profile = profileInput.parse(minimal);
  assert.equal(profile.baptized, false);
  assert.equal(profile.baptism, undefined);
  assert.equal(profile.confirmation, undefined);
  assert.deepEqual(profile.organizations, []);
  assert.equal(profile.marriage, undefined);
});
test("Yes sections require details and checked organizations", () => {
  for (const flag of [
    "baptized",
    "confirmed",
    "hasOrganizations",
    "married",
    "churched",
  ])
    assert.equal(
      profileInput.safeParse({ ...minimal, [flag]: true }).success,
      false,
    );
});
test("inactive nested details and organizations are removed", () => {
  const profile = profileInput.parse({
    ...minimal,
    confirmation: { date: "2020-03-01", place: "Demo", priest: "Demo" },
    organizations: ["Choir"],
  });
  assert.equal(profile.confirmation, undefined);
  assert.deepEqual(profile.organizations, []);
});
test("baptism chronology and calendar dates are validated", () => {
  const baptism = {
    date: "2020-02-01",
    dateOfBirth: "2000-01-01",
    registerNumber: "10",
    registerPage: "20",
    parentsOrFormerReligion: "Demo Parents",
    sponsors: ["Sponsor A", "Sponsor B"],
    residence: "Makurdi",
    priest: "Revd Demo",
  };
  assert.equal(
    profileInput.safeParse({ ...minimal, baptized: true, baptism }).success,
    true,
  );
  for (const bad of [{ dateOfBirth: "2020-02-02" }, { date: "2020-02-30" }])
    assert.equal(
      profileInput.safeParse({
        ...minimal,
        baptized: true,
        baptism: { ...baptism, ...bad },
      }).success,
      false,
    );
});
test("names normalize case and spacing; code rejects query operators", () => {
  assert.equal(normalizeName(" OKEKE   Daniel "), "okeke daniel");
  assert.equal(
    lookupInput.safeParse({ name: "Okeke Daniel", code: { $ne: null } })
      .success,
    false,
  );
  assert.equal(
    lookupInput.safeParse({ name: "Okeke Daniel", code: "short" }).success,
    false,
  );
  assert.equal(
    lookupInput.parse({ name: "Okeke Daniel", code: "ab12cd34ef56" }).code,
    "AB12CD34EF56",
  );
});
test("1000 generated codes have 12 characters with letters and numbers", () => {
  const codes = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const code = generateCode();
    assert.match(code, /^[A-Z0-9]{12}$/);
    assert.match(code, /[A-Z]/);
    assert.match(code, /[0-9]/);
    codes.add(code);
  }
  assert.equal(codes.size, 1000);
});
test("public response omits internal identifiers, author IDs and name index", () => {
  const row = publicRecord({
    ...minimal,
    churchCode: "AB12CD34EF56",
    updatedAt: "2025-01-01T00:00:00Z",
    _id: "private",
    createdBy: "private",
    updatedBy: "private",
    nameKey: "private",
  });
  assert.equal("_id" in row, false);
  assert.equal("createdBy" in row, false);
  assert.equal("nameKey" in row, false);
});
test("display and download preserve No and omit its hidden questions", () => {
  const p = {
    ...profileInput.parse(minimal),
    churchCode: "AB12CD34EF56",
    updatedAt: "2025-01-01T00:00:00Z",
  };
  const lines = recordLines(p);
  assert.ok(lines.some(([k, v]) => k === "Baptized" && v === "No"));
  assert.equal(
    lines.some(([k]) => k === "Date of baptism"),
    false,
  );
  assert.equal(
    lines.some(([k]) => k === "Officiating priests"),
    false,
  );
});
test("PDF generation paginates long comments", () => {
  const record: PublicProfile = {
    ...profileInput.parse({
      ...minimal,
      priestComment: "Long priest comment. ".repeat(190),
    }),
    churchCode: "AB12CD34EF56",
    updatedAt: "2025-01-01T00:00:00Z",
  };
  const font = readFileSync(
    new URL("../public/fonts/Registry.ttf", import.meta.url),
  ).toString("base64");
  const pdf = createRegistryPdf(record, font);
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(pdf.output().startsWith("%PDF"));
});
test("publications validate type, dates, publication status and unknown fields", () => {
  const p = {
    kind: "Activity",
    title: "Choir practice",
    body: "Church choir practice.",
    eventDate: "2027-01-01",
    location: "Church",
    published: false,
  };
  assert.equal(publicationInput.safeParse(p).success, true);
  assert.equal(
    publicationInput.safeParse({ ...p, eventDate: "2027-02-30" }).success,
    false,
  );
  assert.equal(
    publicationInput.safeParse({ ...p, published: "false" }).success,
    false,
  );
  assert.equal(
    publicationInput.safeParse({ ...p, createdBy: "spoof" }).success,
    false,
  );
});
