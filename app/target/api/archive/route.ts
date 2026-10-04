import { NextRequest, NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";

export function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== "campus") return NextResponse.json({ error: "Missing or invalid key" }, { status: 403 });
  return NextResponse.json({ archive: "old student portal export", flag: getFlag("archive") });
}
