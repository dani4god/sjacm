import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { db } from "../lib/db";
import { Admin, Profile, PublicationModel, RateLimit } from "../lib/models";
async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Church Administrator";
  if (
    !email ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !password ||
    password.length < 12 ||
    password.length > 128 ||
    password.startsWith("replace-")
  )
    throw new Error(
      "Set a valid admin email and a strong password of 12–128 characters.",
    );
  await db();
  await Promise.all([
    Admin.init(),
    Profile.init(),
    PublicationModel.init(),
    RateLimit.init(),
  ]);
  if (await Admin.exists({ email }))
    throw new Error("This SJACM admin already exists. No account was changed.");
  await Admin.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "superadmin",
  });
  console.log(
    "SJACM super admin created. Sign in at /login. Remove SUPER_ADMIN_PASSWORD from .env.local.",
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
