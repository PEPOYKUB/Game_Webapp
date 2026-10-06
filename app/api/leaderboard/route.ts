import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, parseFilters } from "@/lib/stats";

export const dynamic = "force-dynamic";

// Public. GET ?roomId=&facultyId=&yearLevel= — usernames, faculty code, year, score and time only (no emails).
export async function GET(request: NextRequest) {
  const rows = await getLeaderboard(parseFilters(request.nextUrl.searchParams), 50);
  return NextResponse.json({ leaderboard: rows.map(({ rank, username, faculty, yearLevel, room, score, durationMs, hints }) => ({ rank, username, faculty, yearLevel, room, score, durationMs, hints })) });
}
