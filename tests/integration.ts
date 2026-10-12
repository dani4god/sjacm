import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import { Profile, PublicationModel, RateLimit, Admin } from "../lib/models";
import { createRegistryPdf } from "../lib/pdf";
import { readFileSync, writeFileSync } from "node:fs";
import { profileInput, type PublicProfile } from "../lib/validation";
const mongo = await MongoMemoryServer.create({
  instance: { args: process.platform === "win32" ? [] : ["--nounixsocket"] },
});
const origin = "http://127.0.0.1:3101";
const uri = mongo.getUri("sjacm_test");
const env = {
  ...process.env,
  MONGODB_URI: uri,
  APP_URL: origin,
  SESSION_SECRET: "test-session-secret-not-for-production-123456789",
  SUPER_ADMIN_NAME: "Test Admin",
  SUPER_ADMIN_EMAIL: "admin@test.example",
  SUPER_ADMIN_PASSWORD: "Private-test-password-2026",
};
let server: ReturnType<typeof spawn> | undefined;
let checks = 0;
try {
  const setup = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/create-super-admin.ts"],
    { env, stdio: "pipe" },
  );
  const [setupExit] = await once(setup, "exit");
  assert.equal(setupExit, 0, "Admin creation script must succeed");
  await mongoose.connect(uri);
  assert.equal(await Admin.countDocuments(), 1);
  assert.equal(
    await mongoose.connection.collection("admins").countDocuments(),
    0,
  );
  const rerun = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/create-super-admin.ts"],
    { env, stdio: "pipe" },
  );
  const [rerunExit] = await once(rerun, "exit");
  assert.equal(rerunExit, 1, "Script must not overwrite existing admin");
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3101",
    ],
    { env, stdio: "pipe" },
  );
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(origin + "/login");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(ready, true, "Next server must start");
  let cookie = "";
  async function request(
    path: string,
    status: number,
    method = "GET",
    body?: unknown,
    authenticated = false,
    requestOrigin = origin,
  ) {
    const res = await fetch(origin + path, {
      method,
      redirect: "manual",
      headers: {
        ...(body !== undefined
          ? { "Content-Type": "application/json", Origin: requestOrigin }
          : {}),
        ...(authenticated ? { Cookie: cookie } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal(res.status, status, `${method} ${path}`);
    checks++;
    return res;
  }
  await request("/", 200);
  await request("/privacy", 200);
  await request("/admin", 307);
  for (const path of ["/api/admin/profiles", "/api/admin/publications"]) {
    await request(path, 401);
    await request(path, 401, "POST", {});
  }
  for (const path of [
    "/api/admin/profiles/507f1f77bcf86cd799439011",
    "/api/admin/publications/507f1f77bcf86cd799439011",
  ])
    await request(path, 401, "PATCH", {});
  await request(
    "/api/registry",
    403,
    "POST",
    {},
    false,
    "https://foreign.example",
  );
  await request("/api/auth/login", 401, "POST", {
    email: env.SUPER_ADMIN_EMAIL,
    password: "wrong",
  });
  const login = await request("/api/auth/login", 200, "POST", {
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
  });
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  assert.ok(login.headers.get("set-cookie")?.includes("HttpOnly"));
  assert.ok(login.headers.get("set-cookie")?.includes("Secure"));
  await request("/admin", 200, "GET", undefined, true);
  const minimal = {
    surname: "Okeke",
    firstName: "Daniel",
    baptized: false,
    confirmed: false,
    hasOrganizations: false,
    organizations: [],
    married: false,
    churched: false,
    priestComment: "Demo registry comment.",
    commentPriest: "Revd Demo",
  };
  const create = await request(
    "/api/admin/profiles",
    201,
    "POST",
    minimal,
    true,
  );
  let saved = (await create.json()).record;
  const originalCode = saved.churchCode;
  assert.match(originalCode, /^[A-Z0-9]{12}$/);
  await request("/api/registry", 404, "POST", {
    name: "Different Person",
    code: originalCode,
  });
  await request("/api/registry", 404, "POST", {
    name: "Okeke Daniel",
    code: "ZZZZZZZZZZZZ",
  });
  const found = await request("/api/registry", 200, "POST", {
    name: " OKEKE   Daniel ",
    code: originalCode.toLowerCase(),
  });
  const publicRow = (await found.json()).record;
  assert.equal(publicRow.baptized, false);
  assert.equal("baptism" in publicRow, false);
  assert.equal("_id" in publicRow, false);
  assert.equal("createdBy" in publicRow, false);
  assert.equal(found.headers.get("cache-control"), "no-store");
  const baptism = {
    date: "2020-02-01",
    dateOfBirth: "2000-01-01",
    registerNumber: "10",
    registerPage: "20",
    parentsOrFormerReligion: "Demo Parents",
    sponsors: ["Sponsor One", "Sponsor Two"],
    residence: "Makurdi",
    priest: "Revd Demo",
  };
  const complete = {
    ...minimal,
    baptized: true,
    baptism,
    confirmed: true,
    confirmation: {
      date: "2022-01-01",
      place: "Makurdi",
      priest: "Bishop Demo",
    },
    hasOrganizations: true,
    organizations: ["Choir", "Mothers’ Union"],
    married: true,
    marriage: {
      spouse: "Demo Spouse",
      date: "2024-01-01",
      priests: ["Revd One", "Revd Two"],
    },
    churched: true,
    churching: { date: "2024-02-01", priest: "Revd Demo" },
  };
  const update = await request(
    `/api/admin/profiles/${saved._id}`,
    200,
    "PATCH",
    complete,
    true,
  );
  saved = (await update.json()).record;
  assert.equal(saved.churchCode, originalCode);
  assert.deepEqual(saved.baptism.sponsors, ["Sponsor One", "Sponsor Two"]);
  await request(
    `/api/admin/profiles/${saved._id}`,
    400,
    "PATCH",
    { ...complete, baptism: { ...baptism, dateOfBirth: "2020-02-02" } },
    true,
  );
  const allYes = await request("/api/registry", 200, "POST", {
    name: "Okeke Daniel",
    code: originalCode,
  });
  assert.equal((await allYes.json()).record.marriage.priests.length, 2);
  const list = await request(
    "/api/admin/profiles?q=okeke%20daniel",
    200,
    "GET",
    undefined,
    true,
  );
  assert.equal((await list.json()).total, 1);
  await assert.rejects(
    Profile.create({
      ...minimal,
      nameKey: "duplicate",
      churchCode: originalCode,
      createdBy: (await Admin.findOne())!._id,
      updatedBy: (await Admin.findOne())!._id,
    }),
    { code: 11000 },
  );
  const extract: PublicProfile = {
    ...profileInput.parse(complete),
    churchCode: originalCode,
    updatedAt: new Date().toISOString(),
  };
  const pdf = createRegistryPdf(
    extract,
    readFileSync(
      new URL("../public/fonts/Registry.ttf", import.meta.url),
    ).toString("base64"),
  );
  assert.ok(pdf.output().startsWith("%PDF"));
  if (process.env.QA_PDF_PATH)
    writeFileSync(
      process.env.QA_PDF_PATH,
      Buffer.from(pdf.output("arraybuffer")),
    );
  await request(
    `/api/admin/profiles/${saved._id}`,
    200,
    "PATCH",
    minimal,
    true,
  );
  const persisted = await Profile.findById(saved._id).lean();
  assert.equal(persisted!.baptism, undefined);
  assert.equal(persisted!.confirmation, undefined);
  assert.equal(persisted!.marriage, undefined);
  assert.equal(persisted!.churching, undefined);
  assert.deepEqual(persisted!.organizations, []);
  const draft = {
    kind: "Activity",
    title: "Demo Choir Gathering",
    body: "Practice and fellowship for the choir.",
    eventDate: "2026-12-01",
    location: "Church hall",
    published: false,
  };
  const publication = await request(
    "/api/admin/publications",
    201,
    "POST",
    draft,
    true,
  );
  const id = (await publication.json()).id;
  assert.equal(
    (await (await request("/", 200)).text()).includes(draft.title),
    false,
  );
  await request(
    `/api/admin/publications/${id}`,
    200,
    "PATCH",
    { ...draft, published: true },
    true,
  );
  assert.equal(
    (await (await request("/", 200)).text()).includes(draft.title),
    true,
  );
  await request(`/api/admin/publications/${id}`, 200, "PATCH", draft, true);
  assert.equal(
    (await (await request("/", 200)).text()).includes(draft.title),
    false,
  );
  assert.equal(await PublicationModel.countDocuments(), 1);
  await request("/api/auth/logout", 200, "POST", {}, true);
  await request("/api/admin/profiles", 401, "GET", undefined, true);
  // Verify the database-backed public throttle, including the configured fixed-window boundary.
  const bucket = Math.floor(Date.now() / (10 * 60000));
  await RateLimit.updateOne(
    { _id: { $regex: `^registry:.*:${bucket}$` } },
    { $set: { count: 30 } },
  );
  await request("/api/registry", 429, "POST", {
    name: "Okeke Daniel",
    code: originalCode,
  });
  console.log(
    `Integration passed: ${checks} HTTP checks, admin setup, unique code enforcement, persisted conditional sections, publication visibility, session revocation and throttling.`,
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server?.kill();
  await mongoose.disconnect();
  await mongo.stop();
}
