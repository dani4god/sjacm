import { NextRequest, NextResponse } from "next/server";
import { cookieName, currentAdmin } from "@/lib/auth";
import { Admin } from "@/lib/models";
import { fail, sameOrigin } from "@/lib/http";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (admin)
      await Admin.updateOne({ _id: admin.id }, { $inc: { sessionVersion: 1 } });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch {
    return fail("Unable to sign out. Try again.", 503);
  }
}
