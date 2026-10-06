import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGameView } from "@/lib/game";
import { positiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET ?roomId= — the signed-in player's own view (session ownership comes from the cookie, never the query).
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const view = await getGameView(auth.user.userId, positiveInt(request.nextUrl.searchParams.get("roomId")));
  return NextResponse.json({ user: { username: auth.user.username, firstName: auth.user.firstName, role: auth.user.role }, ...view });
}
