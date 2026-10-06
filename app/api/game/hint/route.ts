import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/auth";
import { revealHint } from "@/lib/game";
import { positiveInt } from "@/lib/validation";

// POST { puzzleId, level } — records hint_usage once per session and deducts its score on the server.
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const puzzleId = positiveInt(body?.puzzleId);
  const level = positiveInt(body?.level ?? 1);
  if (!puzzleId || !level) return jsonError("Invalid request", 400);
  const result = await revealHint(auth.user.userId, puzzleId, level);
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json(result.data);
}
