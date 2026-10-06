import { adminRoute, ok } from "@/lib/admin-api";
import { listAttempts } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET ?result=correct|wrong&roomId=&q=<username>&page= — correct answers are stored redacted.
export const GET = adminRoute(async ({ request }) => ok(await listAttempts(Object.fromEntries(request.nextUrl.searchParams))));
