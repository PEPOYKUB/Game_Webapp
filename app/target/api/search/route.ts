import { NextRequest, NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  return NextResponse.json({ query, results: [{ title: "Computing Fair 2026", category: "event" }], meta: { endpoint: "/api/search", internalNote: "backup-api: /target/api/archive?key=campus" }, flag: getFlag("leak") });
}
