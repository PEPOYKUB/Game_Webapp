import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok, resolveAnswerHash } from "@/lib/admin-api";
import { puzzleSpec } from "@/lib/admin-specs";
import { answerSource } from "@/lib/flags";
import { parseFields, positiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET ?stageId= — correct_answer_hash is replaced by its source label ("flag:idor" / "custom").
export const GET = adminRoute(async ({ request }) => {
  const stageId = positiveInt(request.nextUrl.searchParams.get("stageId"));
  const puzzles = await db.puzzle.findMany({ where: stageId ? { stageId } : {}, orderBy: { puzzleId: "asc" } });
  return ok({ puzzles: puzzles.map(({ correctAnswerHash, ...p }) => ({ ...p, answerSource: answerSource(correctAnswerHash) })) });
});

// POST { stageId, puzzleTitle, questionText, puzzleType, explanationText?, answerSource, flagKey? | answer? }
export const POST = adminRoute(async ({ body }) => {
  const parsed = parseFields(body, puzzleSpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const answer = resolveAnswerHash(body, { required: true });
  if (answer.error || !answer.hash) return jsonError(answer.error ?? "Answer is required", 400);
  const { stageId, puzzleTitle, questionText, puzzleType, explanationText } = parsed.data;
  const puzzle = await db.puzzle.create({ data: { stageId: stageId!, puzzleTitle: puzzleTitle!, questionText: questionText!, puzzleType: puzzleType!, explanationText: explanationText ?? null, correctAnswerHash: answer.hash }, select: { puzzleId: true } });
  return ok({ puzzle }, 201);
});
