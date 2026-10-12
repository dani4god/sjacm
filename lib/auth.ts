import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { Admin } from "./models";
export const cookieName = "sjacm_session";
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Set SESSION_SECRET to at least 32 random characters");
  return new TextEncoder().encode(secret);
}
export async function sessionToken(id: string, version: number) {
  return new SignJWT({ version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuer("sjacm")
    .setAudience("sjacm-admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());
}
export async function currentAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  let payload;
  try {
    payload = (
      await jwtVerify(token, key(), {
        algorithms: ["HS256"],
        issuer: "sjacm",
        audience: "sjacm-admin",
      })
    ).payload;
  } catch {
    return null;
  }
  await db();
  const admin = await Admin.findById(payload.sub)
    .select("name active role sessionVersion")
    .lean();
  if (
    !admin ||
    !admin.active ||
    admin.role !== "superadmin" ||
    admin.sessionVersion !== payload.version
  )
    return null;
  return { id: String(admin._id), name: String(admin.name) };
}
