import { adminRoute, ok } from "@/lib/admin-api";
import { listUsers } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET ?q=&role=&status=&facultyId=&yearLevel=&page= — no password hashes are ever selected.
export const GET = adminRoute(async ({ request }) => ok(await listUsers(Object.fromEntries(request.nextUrl.searchParams))));
