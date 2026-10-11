import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/auth";
import { abandonSession, startSession } from "@/lib/game";
import { positiveInt } from "@/lib/validation";

// POST { roomId?, restart?, abandon? } — resumes/starts a run, restarts one, or abandons it without replacement.
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => ({}));
  if (body?.restart !== undefined && typeof body.restart !== "boolean") return jsonError("Invalid request", 400);
  if (body?.abandon !== undefined && typeof body.abandon !== "boolean") return jsonError("Invalid request", 400);
  if (body?.roomId !== undefined && body.roomId !== null && !positiveInt(body.roomId)) return jsonError("Invalid room", 400);
  if (body?.abandon === true) {
    const roomId = positiveInt(body?.roomId);
    if (!roomId || body?.restart === true) return jsonError("Invalid request", 400);
    const result = await abandonSession(auth.user.userId, roomId);
    if (!result.ok) return jsonError(result.error, result.status);
    return NextResponse.json(result.data);
  }
  const result = await startSession(auth.user.userId, { roomId: positiveInt(body?.roomId), restart: body?.restart === true });
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json(result.data);
}
