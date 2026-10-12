import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentAdmin } from "@/lib/auth";
import { Profile } from "@/lib/models";
import { profileInput, normalizeName, fullName } from "@/lib/validation";
import { publicRecord } from "@/lib/registry";
import { fail, sameOrigin } from "@/lib/http";
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (!admin) return fail("Sign in to continue.", 401);
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid profile ID.");
    const parsed = profileInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const data = parsed.data;
    const unset = Object.fromEntries(
      ["baptism", "confirmation", "marriage", "churching"]
        .filter((k) => data[k as keyof typeof data] === undefined)
        .map((k) => [k, 1]),
    );
    const set = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );
    const row = await Profile.findByIdAndUpdate(
      id,
      {
        $set: {
          ...set,
          nameKey: normalizeName(fullName(data)),
          updatedBy: admin.id,
        },
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
      },
      { new: true, runValidators: true },
    );
    if (!row) return fail("Profile not found.", 404);
    return NextResponse.json(
      { record: { ...publicRecord(row.toObject()), _id: String(row._id) } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail("Unable to update profile.", 503);
  }
}
