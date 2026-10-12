import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db as prisma } from "../lib/db";
import { HINT_PENALTY, POINTS_PER_CHALLENGE } from "../lib/challenges";
import { buildAnswerHash } from "../lib/flags";
import { ADDITIONAL_SUBJECTS } from "./additional-subject-content";

async function main() {
  for (const roomSpec of ADDITIONAL_SUBJECTS) {
    let room = await prisma.room.findUnique({ where: { roomCode: roomSpec.code } });
    if (!room) room = await prisma.room.create({ data: {
      roomCode: roomSpec.code,
      roomName: roomSpec.name,
      description: roomSpec.description,
      difficultyLevel: roomSpec.difficulty,
      isActive: true,
    } });

    let category = await prisma.category.findUnique({ where: { categoryName: roomSpec.category } });
    if (!category) category = await prisma.category.create({ data: {
      categoryName: roomSpec.category,
      categoryDescription: roomSpec.categoryDescription,
    } });
    const relation = await prisma.roomCategory.findUnique({ where: {
      roomId_categoryId: { roomId: room.roomId, categoryId: category.categoryId },
    } });
    if (!relation) await prisma.roomCategory.create({ data: { roomId: room.roomId, categoryId: category.categoryId } });

    for (const [index, content] of roomSpec.stages.entries()) {
      const stageNumber = index + 1;
      let stage = await prisma.stage.findUnique({ where: {
        roomId_stageNumber: { roomId: room.roomId, stageNumber },
      } });
      if (!stage) stage = await prisma.stage.create({ data: {
        roomId: room.roomId,
        stageNumber,
        stageName: content.name,
        storylineText: `${roomSpec.name.toUpperCase()} / ${String(stageNumber).padStart(2, "0")} — ${content.question}`,
        maxScore: POINTS_PER_CHALLENGE,
      } });

      let puzzle = await prisma.puzzle.findFirst({ where: { stageId: stage.stageId } });
      if (puzzle && puzzle.puzzleTitle !== content.title) {
        throw new Error(`${roomSpec.code} stage ${stageNumber} already contains different puzzle content; refusing to overwrite or add a second puzzle.`);
      }
      if (!puzzle) puzzle = await prisma.puzzle.create({ data: {
        stageId: stage.stageId,
        puzzleTitle: content.title,
        questionText: content.question,
        puzzleType: content.type,
        correctAnswerHash: buildAnswerHash({ answer: content.answer }),
        explanationText: content.explanation,
      } });

      const hint = await prisma.hint.findUnique({ where: {
        puzzleId_hintLevel: { puzzleId: puzzle.puzzleId, hintLevel: 1 },
      } });
      if (!hint) await prisma.hint.create({ data: {
        puzzleId: puzzle.puzzleId,
        hintLevel: 1,
        hintText: content.hint,
        deductionScore: HINT_PENALTY,
      } });
    }
    console.log(`Ready: ${roomSpec.code} (${roomSpec.stages.length} stages)`);
  }
  console.log(`Created/reused ${ADDITIONAL_SUBJECTS.length} additional subject rooms; ${POINTS_PER_CHALLENGE} points per stage, ${HINT_PENALTY} points per hint.`);
}

main().catch((error: unknown) => {
  console.error("Additional subject seed failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
