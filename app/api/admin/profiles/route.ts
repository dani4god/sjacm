import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { Profile } from "@/lib/models";
import { profileInput, normalizeName, fullName } from "@/lib/validation";
import { generateCode, publicRecord } from "@/lib/registry";
import { fail, sameOrigin } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    if (!(await currentAdmin())) return fail("Sign in to continue.", 401);
    const p = Number(req.nextUrl.searchParams.get("page") || 1);
    const page = Number.isFinite(p)
      ? Math.max(1, Math.min(100000, Math.floor(p)))
      : 1;
    const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 200);
    const filter = q
      ? {
          $or: [{ churchCode: q.toUpperCase() }, { nameKey: normalizeName(q) }],
        }
      : {};
    const [rows, total] = await Promise.all([
      Profile.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .lean(),
      Profile.countDocuments(filter),
    ]);
    return NextResponse.json(
      {
        records: rows.map((row) => ({
          ...publicRecord(row),
          _id: String(row._id),
        })),
        total,
        page,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail("Unable to load registry profiles.", 503);
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (!admin) return fail("Sign in to continue.", 401);
    const parsed = profileInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    await Profile.init();
    for (let i = 0; i < 5; i++) {
      try {
        const row = await Profile.create({
          ...parsed.data,
          nameKey: normalizeName(fullName(parsed.data)),
          churchCode: generateCode(),
          createdBy: admin.id,
          updatedBy: admin.id,
        });
        return NextResponse.json(
          { record: { ...publicRecord(row.toObject()), _id: String(row._id) } },
          { status: 201, headers: { "Cache-Control": "no-store" } },
        );
      } catch (e) {
        if ((e as { code?: number }).code !== 11000) throw e;
      }
    }
    return fail("Unable to allocate a unique code. Please try again.", 503);
  } catch {
    return fail("Unable to save profile.", 503);
  }
}
