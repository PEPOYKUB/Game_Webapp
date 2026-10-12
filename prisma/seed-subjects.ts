import { db as prisma } from "../lib/db";
import { HINT_PENALTY, POINTS_PER_CHALLENGE } from "../lib/challenges";
import { buildAnswerHash } from "../lib/flags";
import { DATABASE_QUEST } from "./subject-content";

type Counts = { rooms: number; stages: number; puzzles: number; hints: number };

async function countRows(): Promise<Counts> {
  const [rooms, stages, puzzles, hints] = await Promise.all([
    prisma.room.count(),
    prisma.stage.count(),
    prisma.puzzle.count(),
    prisma.hint.count(),
  ]);
  return { rooms, stages, puzzles, hints };
}

async function main() {
  if (DATABASE_QUEST.stages.length !== 5) throw new Error("Database Quest must contain exactly five stages.");
  if (DATABASE_QUEST.stages.some((stage) => !stage.answer || !stage.hint || !stage.explanation)) {
    throw new Error("Every stage must have an answer, explanation, and hint.");
  }

  const before = await countRows();
  console.log("Database rows before:", JSON.stringify(before));

  // Reuse existing records as-is. This runner never deletes or overwrites content.
  let room = await prisma.room.findUnique({ where: { roomCode: DATABASE_QUEST.code } });
  if (!room) {
    room = await prisma.room.create({
      data: {
        roomCode: DATABASE_QUEST.code,
        roomName: DATABASE_QUEST.name,
        description: DATABASE_QUEST.description,
        difficultyLevel: DATABASE_QUEST.difficulty,
        isActive: true,
      },
    });
  }

  let category = await prisma.category.findUnique({ where: { categoryName: DATABASE_QUEST.category } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        categoryName: DATABASE_QUEST.category,
        categoryDescription: DATABASE_QUEST.categoryDescription,
      },
    });
  }

  const roomCategory = await prisma.roomCategory.findUnique({
    where: { roomId_categoryId: { roomId: room.roomId, categoryId: category.categoryId } },
  });
  if (!roomCategory) {
    await prisma.roomCategory.create({ data: { roomId: room.roomId, categoryId: category.categoryId } });
  }

  for (const content of DATABASE_QUEST.stages) {
    let stage = await prisma.stage.findUnique({
      where: { roomId_stageNumber: { roomId: room.roomId, stageNumber: content.number } },
    });
    if (!stage) {
      stage = await prisma.stage.create({
        data: {
          roomId: room.roomId,
          stageNumber: content.number,
          stageName: content.name,
          storylineText: `DATABASE QUEST / ${String(content.number).padStart(2, "0")} — ${content.question}`,
          maxScore: POINTS_PER_CHALLENGE,
        },
      });
    }

    let puzzle = await prisma.puzzle.findFirst({
      where: { stageId: stage.stageId, puzzleTitle: content.title },
    });
    if (!puzzle) {
      puzzle = await prisma.puzzle.create({
        data: {
          stageId: stage.stageId,
          puzzleTitle: content.title,
          questionText: content.question,
          puzzleType: content.type,
          correctAnswerHash: buildAnswerHash({ answer: content.answer }),
          explanationText: content.explanation,
        },
      });
    }

    const hint = await prisma.hint.findUnique({
      where: { puzzleId_hintLevel: { puzzleId: puzzle.puzzleId, hintLevel: 1 } },
    });
    if (!hint) {
      await prisma.hint.create({
        data: {
          puzzleId: puzzle.puzzleId,
          hintLevel: 1,
          hintText: content.hint,
          deductionScore: HINT_PENALTY,
        },
      });
    }
  }

  const after = await countRows();
  console.log("Database rows after:", JSON.stringify(after));
  console.log(`Database Quest ready (${DATABASE_QUEST.code}); stage score=${POINTS_PER_CHALLENGE}, hint penalty=${HINT_PENALTY}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Subject seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
