import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { PublicationModel } from "@/lib/models";
import { publicationInput } from "@/lib/validation";
import { fail, sameOrigin } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    if (!(await currentAdmin())) return fail("Sign in to continue.", 401);
    const p = Number(req.nextUrl.searchParams.get("page") || 1);
    const page = Number.isFinite(p)
      ? Math.max(1, Math.min(100000, Math.floor(p)))
      : 1;
    const [records, total] = await Promise.all([
      PublicationModel.find()
        .select("-__v -createdBy -updatedBy")
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .lean(),
      PublicationModel.countDocuments(),
    ]);
    return NextResponse.json(
      { records, total, page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail("Unable to load publications.", 503);
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (!admin) return fail("Sign in to continue.", 401);
    const parsed = publicationInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const row = await PublicationModel.create({
      ...parsed.data,
      createdBy: admin.id,
      updatedBy: admin.id,
    });
    return NextResponse.json({ id: String(row._id) }, { status: 201 });
  } catch {
    return fail("Unable to save publication.", 503);
  }
}
