import { db } from "@/lib/db";
import { adminRoute, ok } from "@/lib/admin-api";
import { refreshAnswerHash } from "@/lib/flags";

// POST — recompute hashes of puzzles that use a built-in Target Website flag (needed after FLAG_SECRET changes).
export const POST = adminRoute(async () => {
  const puzzles = await db.puzzle.findMany({ select: { puzzleId: true, correctAnswerHash: true } });
  let updated = 0;
  for (const puzzle of puzzles) {
    const fresh = refreshAnswerHash(puzzle.correctAnswerHash);
    if (fresh && fresh !== puzzle.correctAnswerHash) {
      await db.puzzle.update({ where: { puzzleId: puzzle.puzzleId }, data: { correctAnswerHash: fresh } });
      updated += 1;
    }
  }
  return ok({ checked: puzzles.length, updated });
});
