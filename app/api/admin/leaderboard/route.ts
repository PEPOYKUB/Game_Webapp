import { adminRoute, ok } from "@/lib/admin-api";
import { getLeaderboard, parseFilters } from "@/lib/stats";

export const dynamic = "force-dynamic";

// GET ?roomId=&facultyId=&yearLevel= — like the public board, but includes session ids and timestamps.
export const GET = adminRoute(async ({ request }) => ok({ leaderboard: await getLeaderboard(parseFilters(request.nextUrl.searchParams), 200) }));
