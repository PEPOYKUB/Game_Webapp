import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok, resolveAnswerHash } from "@/lib/admin-api";
import { puzzleSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

// PATCH — any puzzle field; send answerSource (+ flagKey/answer) only to replace the answer.
export const PATCH = adminRoute(async ({ id, body }) => {
  const parsed = parseFields(body, puzzleSpec, { partial: true });
  const answer = resolveAnswerHash(body, { required: false });
  if (answer.error) return jsonError(answer.error, 400);
  if (parsed.error && !(answer.hash && parsed.error === "Nothing to update")) return jsonError(parsed.error, 400);
  await db.puzzle.update({ where: { puzzleId: id! }, data: { ...parsed.data, ...(answer.hash && { correctAnswerHash: answer.hash }) } });
  return ok({ updated: true, answerChanged: Boolean(answer.hash) });
}, "puzzleId");

// DELETE — refused once players have attempted it (puzzle_attempt.puzzle_id is ON DELETE RESTRICT).
export const DELETE = adminRoute(async ({ id }) => {
  const attempts = await db.puzzleAttempt.count({ where: { puzzleId: id! } });
  if (attempts > 0) return jsonError(`This puzzle has ${attempts} attempt(s) — it cannot be deleted`, 409);
  await db.puzzle.delete({ where: { puzzleId: id! } });
  return ok({ deleted: true });
}, "puzzleId");
