import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentAdmin } from "@/lib/auth";
import { PublicationModel } from "@/lib/models";
import { publicationInput } from "@/lib/validation";
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
    if (!mongoose.isValidObjectId(id)) return fail("Invalid publication ID.");
    const parsed = publicationInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const row = await PublicationModel.findByIdAndUpdate(
      id,
      { $set: { ...parsed.data, updatedBy: admin.id } },
      { new: true, runValidators: true },
    );
    if (!row) return fail("Publication not found.", 404);
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Unable to update publication.", 503);
  }
}
