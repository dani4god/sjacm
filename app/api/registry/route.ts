import { NextRequest, NextResponse } from "next/server";
import { lookupInput, normalizeName } from "@/lib/validation";
import { Profile } from "@/lib/models";
import { publicRecord } from "@/lib/registry";
import { fail, limited, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    if (await limited(req, "registry", 30, 10))
      return fail("Too many attempts. Please try again later.", 429);
    const parsed = lookupInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const row = await Profile.findOne({
      churchCode: parsed.data.code,
      nameKey: normalizeName(parsed.data.name),
    })
      .select("-__v -createdBy -updatedBy -nameKey")
      .lean();
    if (!row)
      return fail(
        "No matching record. Check the registered name and church code.",
        404,
      );
    return NextResponse.json(
      { record: publicRecord(row) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail(
      "The registry is temporarily unavailable. Please try again.",
      503,
    );
  }
}
