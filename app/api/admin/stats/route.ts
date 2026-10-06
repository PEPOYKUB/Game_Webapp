import { adminRoute, ok } from "@/lib/admin-api";
import { getAdminOverview, getAnalytics, getFacultyBreakdown, parseFilters } from "@/lib/stats";

export const dynamic = "force-dynamic";

// GET ?roomId=&facultyId=&yearLevel= — overview counters + per-stage / per-puzzle / per-hint analytics.
export const GET = adminRoute(async ({ request }) => {
  const filters = parseFilters(request.nextUrl.searchParams);
  const [overview, analytics, faculties] = await Promise.all([getAdminOverview(filters), getAnalytics(filters), getFacultyBreakdown()]);
  return ok({ filters, overview, analytics, faculties });
});
