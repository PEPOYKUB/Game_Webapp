import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROGRESS_STATUS, ROLE, SESSION_STATUS, USER_STATUS } from "../lib/constants";

const prisma = new PrismaClient();
const demoPassword = "DemoPass2026!";
const players = [
  { username: "demo_player_02", roomCode: "KKU-PROG-01", facultyCode: "CP", yearLevel: 1, score: 500, durationMinutes: 11, hintedStages: [] as number[] },
  { username: "demo_player_03", roomCode: "KKU-DS-01", facultyCode: "EN", yearLevel: 2, score: 450, durationMinutes: 14, hintedStages: [1, 3] },
  { username: "demo_player_04", roomCode: "KKU-NET-01", facultyCode: "SC", yearLevel: 3, score: 425, durationMinutes: 18, hintedStages: [1, 2, 4] },
  { username: "demo_player_05", roomCode: "KKU-OS-01", facultyCode: "AR", yearLevel: 4, score: 400, durationMinutes: 22, hintedStages: [1, 2, 3, 5] },
  { username: "demo_player_06", roomCode: "KKU-MATH-01", facultyCode: "BS", yearLevel: 5, score: 375, durationMinutes: 16, hintedStages: [1, 2, 3, 4, 5] },
  { username: "demo_player_07", roomCode: "KKU-STAT-01", facultyCode: "HS", yearLevel: 6, score: 475, durationMinutes: 10, hintedStages: [2] },
  { username: "demo_player_08", roomCode: "KKU-WEB-01", facultyCode: "MD", yearLevel: 7, score: 375, durationMinutes: 21, hintedStages: [1, 2, 3, 4, 5] },
  { username: "demo_player_09", roomCode: "KKU-WEB-BONUS", facultyCode: "NS", yearLevel: 8, score: 75, durationMinutes: 6, hintedStages: [1] },
  { username: "demo_player_10", roomCode: "KKU-DB-QUEST-01", facultyCode: "PH", yearLevel: null, score: 375, durationMinutes: 17, hintedStages: [1, 2, 3, 4, 5] },
];

async function remapExistingSession(sessionId: number, targetRoomId: number, player: typeof players[number]) {
  const sourceData = await prisma.gameSession.findUniqueOrThrow({
    where: { sessionId },
    include: {
      progress: { include: { stage: { select: { stageNumber: true } } } },
      attempts: { include: { puzzle: { include: { stage: { select: { stageNumber: true } } } } } },
      hintUsages: { include: { hint: { include: { puzzle: { include: { stage: { select: { stageNumber: true } } } } } } } },
    },
  });
  const targetStages = await prisma.stage.findMany({
    where: { roomId: targetRoomId }, orderBy: { stageNumber: "asc" },
    include: { puzzles: { orderBy: { puzzleId: "asc" }, include: { hints: { where: { hintLevel: 1 } } } } },
  });
  const stageMap = new Map(targetStages.map(stage => [stage.stageNumber, stage]));
  if (sourceData.progress.some(row => !stageMap.has(row.stage.stageNumber)) || sourceData.attempts.some(row => !stageMap.get(row.puzzle.stage.stageNumber)?.puzzles[0])) {
    throw new Error(`Cannot safely map existing session ${sessionId} to ${player.roomCode}.`);
  }
  const user = await prisma.appUser.findUniqueOrThrow({ where: { userId: sourceData.userId } });

  await prisma.$transaction(async tx => {
    for (const row of sourceData.progress) {
      const stage = stageMap.get(row.stage.stageNumber)!;
      await tx.stageProgress.update({ where: { progressId: row.progressId }, data: { stageId: stage.stageId } });
    }
    for (const row of sourceData.attempts) {
      const puzzle = stageMap.get(row.puzzle.stage.stageNumber)!.puzzles[0];
      await tx.puzzleAttempt.update({ where: { attemptId: row.attemptId }, data: { puzzleId: puzzle.puzzleId } });
    }
    for (const row of sourceData.hintUsages) {
      const hint = stageMap.get(row.hint.puzzle.stage.stageNumber)!.puzzles[0].hints[0];
      if (!hint) throw new Error(`Target hint missing in ${player.roomCode}.`);
      await tx.hintUsage.update({ where: { hintUsageId: row.hintUsageId }, data: { hintId: hint.hintId } });
    }
    await tx.gameSession.update({ where: { sessionId }, data: { roomId: targetRoomId } });
    await tx.appUser.update({ where: { userId: user.userId }, data: { facultyId: (await tx.faculty.findUniqueOrThrow({ where: { facultyCode: player.facultyCode } })).facultyId, yearLevel: player.yearLevel } });
  });
}

async function main() {
  const prepared = await Promise.all(players.map(async player => {
    const [room, faculty] = await Promise.all([
      prisma.room.findUnique({ where: { roomCode: player.roomCode } }),
      prisma.faculty.findUnique({ where: { facultyCode: player.facultyCode } }),
    ]);
    if (!room || !faculty) throw new Error(`Missing room ${player.roomCode} or faculty ${player.facultyCode}; run the room seeds first.`);
    const stages = await prisma.stage.findMany({
      where: { roomId: room.roomId }, orderBy: { stageNumber: "asc" },
      include: { puzzles: { orderBy: { puzzleId: "asc" }, include: { hints: { where: { hintLevel: 1 } } } } },
    });
    if (!stages.length || stages.some(stage => stage.puzzles.length !== 1 || !stage.puzzles[0].hints.length)) {
      throw new Error(`Expected one puzzle and a level-1 hint in every stage of ${player.roomCode}.`);
    }
    const max = stages.reduce((sum, stage) => sum + stage.maxScore, 0);
    const deduction = player.hintedStages.reduce((sum, number) => sum + (stages.find(stage => stage.stageNumber === number)?.puzzles[0].hints[0].deductionScore ?? 0), 0);
    if (max - deduction !== player.score) throw new Error(`Configured score mismatch for ${player.username}.`);
    const email = `${player.username}@example.test`;
    const [byUsername, byEmail] = await Promise.all([
      prisma.appUser.findUnique({ where: { username: player.username } }),
      prisma.appUser.findUnique({ where: { email } }),
    ]);
    if ((byUsername || byEmail) && (!byUsername || byUsername.userId !== byEmail?.userId)) throw new Error(`Username/email conflict for ${player.username}; no writes performed.`);
    if (byUsername && (byUsername.role !== ROLE.player || byUsername.status !== USER_STATUS.active)) throw new Error(`Existing ${player.username} is not an active PLAYER.`);
    return { player, room, faculty, stages, email, existing: byUsername };
  }));

  const sourceRoom = await prisma.room.findUnique({ where: { roomCode: "KKU-DB-QUEST-01" } });
  const legacyNames = new Set(["demo_player_02", "demo_player_03", "demo_player_04", "demo_player_05"]);
  // Validate existing synthetic sessions before making any writes.
  for (const item of prepared.filter(entry => legacyNames.has(entry.player.username))) {
    if (!item.existing) continue;
    const targetRun = await prisma.gameSession.findFirst({ where: { userId: item.existing.userId, roomId: item.room.roomId, status: SESSION_STATUS.completed } });
    if (targetRun) continue;
    const sourceRuns = sourceRoom ? await prisma.gameSession.findMany({ where: { userId: item.existing.userId, roomId: sourceRoom.roomId, status: SESSION_STATUS.completed } }) : [];
    if (sourceRuns.length > 1) throw new Error(`Multiple legacy Database Quest sessions found for ${item.player.username}; refusing ambiguous migration.`);
    if (sourceRuns.length === 1 && (await prisma.gameSession.findMany({ where: { userId: item.existing.userId, status: SESSION_STATUS.completed } })).length !== 1) {
      throw new Error(`Unexpected additional completed session for ${item.player.username}; refusing to alter history.`);
    }
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const created: string[] = [];
  const migrated: string[] = [];
  const unchanged: string[] = [];
  for (const item of prepared) {
    const { player, room, faculty, stages, email } = item;
    const user = item.existing ?? await prisma.appUser.create({ data: {
      username: player.username, email, passwordHash,
      firstName: "Demo", lastName: `Player ${player.username.slice(-2)}`,
      facultyId: faculty.facultyId, yearLevel: player.yearLevel,
      role: ROLE.player, status: USER_STATUS.active,
    } });

    let run = await prisma.gameSession.findFirst({ where: { userId: user.userId, roomId: room.roomId, status: SESSION_STATUS.completed } });
    if (!run && legacyNames.has(player.username) && sourceRoom) {
      const legacyRun = await prisma.gameSession.findFirst({ where: { userId: user.userId, roomId: sourceRoom.roomId, status: SESSION_STATUS.completed } });
      if (legacyRun) {
        await remapExistingSession(legacyRun.sessionId, room.roomId, player);
        migrated.push(player.username);
        run = legacyRun;
      }
    }
    if (run) {
      // Keep completed scores and attempts intact; only enforce the approved demo demographics.
      await prisma.appUser.update({ where: { userId: user.userId }, data: { facultyId: faculty.facultyId, yearLevel: player.yearLevel } });
      unchanged.push(player.username);
      continue;
    }

    const endedAt = new Date(Date.now() - (players.indexOf(player) + 1) * 60_000);
    const startedAt = new Date(endedAt.getTime() - player.durationMinutes * 60_000);
    const progress = stages.map(stage => ({
      stageId: stage.stageId, status: PROGRESS_STATUS.completed,
      scoreEarned: stage.maxScore - (player.hintedStages.includes(stage.stageNumber) ? stage.puzzles[0].hints[0].deductionScore : 0),
      startedAt, completedAt: endedAt,
    }));
    const total = progress.reduce((sum, row) => sum + row.scoreEarned, 0);
    await prisma.gameSession.create({ data: {
      userId: user.userId, roomId: room.roomId, startedAt, endedAt,
      status: SESSION_STATUS.completed, finalScore: total,
      progress: { create: progress },
      attempts: { create: stages.map(stage => ({
        puzzleId: stage.puzzles[0].puzzleId,
        submittedAnswer: "[REDACTED: correct answer]", isCorrect: true, attemptedAt: endedAt,
      })) },
      hintUsages: { create: player.hintedStages.map(stageNumber => {
        const hint = stages.find(stage => stage.stageNumber === stageNumber)!.puzzles[0].hints[0];
        return { hintId: hint.hintId, scoreDeducted: hint.deductionScore, usedAt: endedAt };
      }) },
    } });
    created.push(player.username);
  }

  console.log(`Created synthetic leaderboard records: ${created.join(", ") || "none"}`);
  console.log(`Migrated prior synthetic sessions without resetting scores: ${migrated.join(", ") || "none"}`);
  console.log(`Already complete; preserved: ${unchanged.join(", ") || "none"}`);
  console.log("Assignments:");
  for (const item of prepared) console.log(`  ${item.player.username}: ${item.player.roomCode} / ${item.player.facultyCode} / ${item.player.yearLevel ?? "—"} / ${item.player.score} pts`);
  console.log("These demo accounts and results are synthetic presentation data, not real player results.");
  console.log(`Shared local demo password: ${demoPassword}`);
}

main().catch((error: unknown) => {
  console.error("Leaderboard demo seed failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
