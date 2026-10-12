import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { db } from "./db";
import { RateLimit } from "./models";
export function fail(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function sameOrigin(req: NextRequest) {
  const configured = process.env.APP_URL;
  if (!configured) return false;
  return (
    req.headers.get("origin") === new URL(configured).origin &&
    req.headers.get("content-type")?.includes("application/json")
  );
}
export async function limited(
  req: NextRequest,
  scope: string,
  max: number,
  minutes: number,
  identity?: string,
) {
  await db();
  // Vercel overwrites x-vercel-forwarded-for. Locally use one conservative shared bucket.
  const ip = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    : "local";
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET missing");
  const bucket = Math.floor(Date.now() / (minutes * 60000));
  const hash = createHmac("sha256", secret)
    .update(identity || ip)
    .digest("hex");
  const id = `${scope}:${hash}:${bucket}`;
  let row;
  try {
    row = await RateLimit.findOneAndUpdate(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((bucket + 2) * minutes * 60000) },
      },
      { upsert: true, new: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    row = await RateLimit.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 } },
      { new: true },
    );
  }
  return !row || row.count > max;
}
