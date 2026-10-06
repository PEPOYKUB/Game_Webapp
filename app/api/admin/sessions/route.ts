import { adminRoute, ok } from "@/lib/admin-api";
import { listSessions } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET ?status=ACTIVE|COMPLETED|ABANDONED&page=
export const GET = adminRoute(async ({ request }) => ok(await listSessions(Object.fromEntries(request.nextUrl.searchParams))));
