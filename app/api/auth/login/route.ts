import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Admin } from "@/lib/models";
import { cookieName, sessionToken } from "@/lib/auth";
import { fail, limited, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
const input = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    if (await limited(req, "login-ip", 20, 15))
      return fail("Too many attempts. Try again in 15 minutes.", 429);
    const parsed = input.safeParse(await req.json());
    if (!parsed.success) return fail("Enter a valid email and password.");
    if (await limited(req, "login-account", 8, 15, parsed.data.email))
      return fail("Too many attempts. Try again in 15 minutes.", 429);
    const admin = await Admin.findOne({
      email: parsed.data.email,
      active: true,
    });
    const fallback =
      "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
    const valid = await bcrypt.compare(
      parsed.data.password,
      admin?.passwordHash || fallback,
    );
    if (!admin || !valid) return fail("Invalid email or password.", 401);
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      cookieName,
      await sessionToken(String(admin._id), admin.sessionVersion),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 8 * 3600,
      },
    );
    return response;
  } catch {
    return fail("Unable to sign in. Check server configuration.", 503);
  }
}
