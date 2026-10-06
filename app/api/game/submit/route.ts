import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/auth";
import { submitAnswer } from "@/lib/game";
import { rateLimit } from "@/lib/rate-limit";
import { positiveInt } from "@/lib/validation";

// POST { puzzleId, flag } — checked on the server against puzzle.correct_answer_hash.
// The response only says whether it was correct; the flag itself is never returned.
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const puzzleId = positiveInt(body?.puzzleId);
  const flag = body?.flag;
  if (!puzzleId || typeof flag !== "string" || !flag.trim() || flag.length > 200) return jsonError("Invalid request", 400);
  if (!rateLimit(`submit:${auth.user.userId}`, 10, 60 * 1000)) return jsonError("Too many submissions — slow down and investigate first", 429);

  const result = await submitAnswer(auth.user.userId, puzzleId, flag);
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json(result.data);
}
