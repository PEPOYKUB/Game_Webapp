// Server-only game engine. The database is the single source of truth for sessions, progress,
// attempts, hint usage, score and achievements — the client only renders what this returns.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PROGRESS_STATUS, SESSION_STATUS } from "@/lib/constants";
import { checkAnswer, isKnownFlag } from "@/lib/flags";

export { PROGRESS_STATUS, SESSION_STATUS };

type Tx = Prisma.TransactionClient;
type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const REDACTED_CORRECT = "[REDACTED: correct flag]";
const REDACTED_OTHER_FLAG = "[REDACTED: flag for another challenge]";
const SPEEDRUN_MS = 30 * 60 * 1000;

/** Achievement codes evaluated by awardAchievements(); any other code is awarded manually by an admin. */
export const AUTO_ACHIEVEMENTS = ["FIRST_FLAG", "ROOM_CLEARED", "NO_HINTS", "FLAWLESS", "SPEEDRUN"] as const;

const fail = (status: number, error: string) => ({ ok: false as const, status, error });

const roomInclude = { stages: { orderBy: { stageNumber: "asc" as const }, include: { puzzles: { orderBy: { puzzleId: "asc" as const }, include: { hints: { orderBy: { hintLevel: "asc" as const } } } } } } };

/** Active rooms that can actually be played: at least one stage, and a puzzle in every stage. */
export async function getPlayableRooms() {
  const rooms = await db.room.findMany({ where: { isActive: true }, orderBy: { roomId: "asc" }, include: roomInclude });
  return rooms.filter(room => room.stages.length > 0 && room.stages.every(stage => stage.puzzles.length > 0));
}

/** The requested playable room, or the first playable room when none (or an unplayable one) is requested. */
export async function getPlayableRoom(roomId?: number | null) {
  const rooms = await getPlayableRooms();
  return rooms.find(room => room.roomId === roomId) ?? rooms[0] ?? null;
}

function findActiveSession(client: Tx | typeof db, userId: number, roomId: number) {
  return client.gameSession.findFirst({ where: { userId, roomId, status: SESSION_STATUS.active }, orderBy: { startedAt: "desc" } });
}

// ---------------------------------------------------------------------------------------------
// Read model for the player page
// ---------------------------------------------------------------------------------------------

export async function getGameView(userId: number, requestedRoomId?: number | null) {
  // Without an explicit choice, resume the room of the player's running session.
  const running = requestedRoomId ? null : await db.gameSession.findFirst({ where: { userId, status: SESSION_STATUS.active }, orderBy: { startedAt: "desc" }, select: { roomId: true } });
  const [rooms, achievements] = await Promise.all([
    getPlayableRooms(),
    db.achievement.findMany({ orderBy: { achievementId: "asc" }, include: { users: { where: { userId }, select: { unlockedAt: true } } } }),
  ]);
  const room = rooms.find(r => r.roomId === (requestedRoomId ?? running?.roomId)) ?? rooms[0] ?? null;
  const roomList = rooms.map(r => ({ roomId: r.roomId, code: r.roomCode, name: r.roomName, difficulty: r.difficultyLevel }));
  const achievementView = achievements.map(a => ({ code: a.achievementCode, name: a.achievementName, description: a.description, icon: a.badgeIconUrl, unlockedAt: a.users[0]?.unlockedAt ?? null }));
  if (!room) return { rooms: roomList, room: null, session: null, stages: [], stats: null, achievements: achievementView };

  // Latest session that was not thrown away: the running one, or the last finished one (summary screen).
  const session = await db.gameSession.findFirst({
    where: { userId, roomId: room.roomId, status: { not: SESSION_STATUS.abandoned } },
    orderBy: { startedAt: "desc" },
    include: { progress: true, attempts: { select: { puzzleId: true, isCorrect: true } }, hintUsages: { select: { hintId: true, scoreDeducted: true } } },
  });

  const solvedPuzzles = new Set(session?.attempts.filter(a => a.isCorrect).map(a => a.puzzleId));
  const usedHints = new Set(session?.hintUsages.map(h => h.hintId));

  const stages = room.stages.map(stage => {
    const progress = session?.progress.find(p => p.stageId === stage.stageId);
    const status = progress?.status ?? PROGRESS_STATUS.locked;
    const open = status !== PROGRESS_STATUS.locked;
    return {
      stageId: stage.stageId,
      number: stage.stageNumber,
      name: stage.stageName,
      maxScore: stage.maxScore,
      status,
      scoreEarned: progress?.scoreEarned ?? 0,
      // Locked stages expose nothing but their name, like the original UI.
      objective: open ? stage.storylineText : null,
      puzzles: open ? stage.puzzles.map(p => {
        const solved = solvedPuzzles.has(p.puzzleId);
        return {
          puzzleId: p.puzzleId,
          title: p.puzzleTitle,
          question: p.questionText,
          type: p.puzzleType,
          solved,
          explanation: solved ? p.explanationText : null,
          hints: p.hints.map(h => ({ level: h.hintLevel, deduction: h.deductionScore, used: usedHints.has(h.hintId), text: usedHints.has(h.hintId) ? h.hintText : null })),
        };
      }) : [],
    };
  });

  return {
    rooms: roomList,
    room: { roomId: room.roomId, code: room.roomCode, name: room.roomName, description: room.description, difficulty: room.difficultyLevel },
    session: session && {
      sessionId: session.sessionId,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      finalScore: session.finalScore,
    },
    stages,
    stats: session && {
      solvedStages: session.progress.filter(p => p.status === PROGRESS_STATUS.completed).length,
      totalStages: room.stages.length,
      hintsUsed: session.hintUsages.length,
      pointsDeducted: session.hintUsages.reduce((sum, h) => sum + h.scoreDeducted, 0),
      attempts: session.attempts.length,
      wrongAttempts: session.attempts.filter(a => !a.isCorrect).length,
    },
    achievements: achievementView,
  };
}

export type GameView = Awaited<ReturnType<typeof getGameView>>;

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

export async function startSession(userId: number, { roomId = null, restart = false }: { roomId?: number | null; restart?: boolean } = {}): Promise<Result<{ sessionId: number; roomId: number }>> {
  const room = await getPlayableRoom(roomId);
  if (roomId && room?.roomId !== roomId) return fail(404, "That room is not open");
  if (!room || room.stages.length === 0) return fail(409, "No active room is available");
  const now = new Date();
  try {
    return await createSession(userId, room, now, restart);
  } catch (error) {
    // uq_game_session_one_active: a parallel request (double click) already opened the session.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    const active = await findActiveSession(db, userId, room.roomId);
    if (!active) throw error;
    return { ok: true, data: { sessionId: active.sessionId, roomId: room.roomId } };
  }
}

function createSession(userId: number, room: { roomId: number; stages: { stageId: number }[] }, now: Date, restart: boolean): Promise<Result<{ sessionId: number; roomId: number }>> {
  return db.$transaction(async tx => {
    const active = await findActiveSession(tx, userId, room.roomId);
    if (active && !restart) return { ok: true as const, data: { sessionId: active.sessionId, roomId: room.roomId } };
    if (active) await tx.gameSession.update({ where: { sessionId: active.sessionId }, data: { status: SESSION_STATUS.abandoned, endedAt: now } });
    const session = await tx.gameSession.create({
      data: {
        userId,
        roomId: room.roomId,
        startedAt: now,
        status: SESSION_STATUS.active,
        finalScore: 0,
        progress: { create: room.stages.map((stage, index) => ({ stageId: stage.stageId, status: index === 0 ? PROGRESS_STATUS.inProgress : PROGRESS_STATUS.locked, startedAt: index === 0 ? now : null })) },
      },
    });
    return { ok: true as const, data: { sessionId: session.sessionId, roomId: room.roomId } };
  });
}

/** Loads the puzzle plus the caller's active session and stage progress, enforcing stage order. */
async function loadPlayablePuzzle(userId: number, puzzleId: number) {
  const puzzle = await db.puzzle.findUnique({ where: { puzzleId }, include: { stage: { include: { room: { select: { isActive: true } } } } } });
  if (!puzzle || !puzzle.stage.room.isActive) return fail(404, "Unknown challenge");
  const session = await findActiveSession(db, userId, puzzle.stage.roomId);
  if (!session) return fail(409, "No active game session — press START GAME first");
  const progress = await db.stageProgress.findUnique({ where: { sessionId_stageId: { sessionId: session.sessionId, stageId: puzzle.stageId } } });
  if (!progress || progress.status === PROGRESS_STATUS.locked) return fail(403, "This stage is still locked");
  return { ok: true as const, data: { puzzle, session, progress } };
}

export async function submitAnswer(userId: number, puzzleId: number, answer: string): Promise<Result<{ correct: boolean; alreadySolved?: boolean; sessionCompleted?: boolean; newAchievements?: string[] }>> {
  const loaded = await loadPlayablePuzzle(userId, puzzleId);
  if (!loaded.ok) return loaded;
  const { puzzle, session, progress } = loaded.data;

  const alreadySolved = await db.puzzleAttempt.findFirst({ where: { sessionId: session.sessionId, puzzleId, isCorrect: true }, select: { attemptId: true } });
  if (alreadySolved) return { ok: true, data: { correct: true, alreadySolved: true } };

  const correct = checkAnswer(puzzle.correctAnswerHash, answer);
  // Never persist a working flag: correct answers and flags for other challenges are redacted.
  const otherAnswers = correct ? [] : await db.puzzle.findMany({ where: { stage: { roomId: puzzle.stage.roomId }, puzzleId: { not: puzzleId } }, select: { correctAnswerHash: true } });
  const isOtherFlag = isKnownFlag(answer) || otherAnswers.some(p => checkAnswer(p.correctAnswerHash, answer));
  const stored = correct ? REDACTED_CORRECT : isOtherFlag ? REDACTED_OTHER_FLAG : answer.trim().slice(0, 1000);
  const now = new Date();

  const outcome = await db.$transaction(async tx => {
    await tx.puzzleAttempt.create({ data: { sessionId: session.sessionId, puzzleId, submittedAnswer: stored, isCorrect: correct, attemptedAt: now } });
    if (!correct) return { sessionCompleted: false, newAchievements: [] as string[] };

    const stagePuzzles = await tx.puzzle.findMany({ where: { stageId: puzzle.stageId }, select: { puzzleId: true } });
    const solved = await tx.puzzleAttempt.findMany({ where: { sessionId: session.sessionId, isCorrect: true, puzzleId: { in: stagePuzzles.map(p => p.puzzleId) } }, distinct: ["puzzleId"], select: { puzzleId: true } });
    if (solved.length === stagePuzzles.length) {
      const completed = await tx.stageProgress.updateMany({ where: { progressId: progress.progressId, status: { not: PROGRESS_STATUS.completed } }, data: { status: PROGRESS_STATUS.completed, completedAt: now } });
      if (completed.count) {
        const nextStage = await tx.stage.findFirst({ where: { roomId: puzzle.stage.roomId, stageNumber: { gt: puzzle.stage.stageNumber } }, orderBy: { stageNumber: "asc" } });
        if (nextStage) await tx.stageProgress.updateMany({ where: { sessionId: session.sessionId, stageId: nextStage.stageId, status: PROGRESS_STATUS.locked }, data: { status: PROGRESS_STATUS.inProgress, startedAt: now } });
      }
    }

    await recomputeScore(tx, session.sessionId);
    const remaining = await tx.stageProgress.count({ where: { sessionId: session.sessionId, status: { not: PROGRESS_STATUS.completed } } });
    const finished = remaining === 0 && (await tx.gameSession.updateMany({ where: { sessionId: session.sessionId, status: SESSION_STATUS.active }, data: { status: SESSION_STATUS.completed, endedAt: now } })).count > 0;
    const newAchievements = await awardAchievements(tx, userId, session.sessionId);
    return { sessionCompleted: finished, newAchievements };
  });

  return { ok: true, data: { correct, ...outcome } };
}

export async function revealHint(userId: number, puzzleId: number, level: number): Promise<Result<{ level: number; text: string; deduction: number }>> {
  const loaded = await loadPlayablePuzzle(userId, puzzleId);
  if (!loaded.ok) return loaded;
  const { session, progress } = loaded.data;
  if (progress.status === PROGRESS_STATUS.completed) return fail(409, "Stage already completed — hints are closed");

  const hints = await db.hint.findMany({ where: { puzzleId }, orderBy: { hintLevel: "asc" } });
  const hint = hints.find(h => h.hintLevel === level);
  if (!hint) return fail(404, "Unknown hint");
  const used = new Set((await db.hintUsage.findMany({ where: { sessionId: session.sessionId, hintId: { in: hints.map(h => h.hintId) } }, select: { hintId: true } })).map(u => u.hintId));
  const previous = hints.filter(h => h.hintLevel < level);
  if (previous.some(h => !used.has(h.hintId))) return fail(409, "Open the lower-level hint first");

  if (!used.has(hint.hintId)) {
    try {
      await db.$transaction(async tx => {
        await tx.hintUsage.create({ data: { sessionId: session.sessionId, hintId: hint.hintId, scoreDeducted: hint.deductionScore } });
        await recomputeScore(tx, session.sessionId);
      });
    } catch (error) {
      // uq_hint_usage_session_hint: a parallel request already charged this hint — don't charge twice.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  return { ok: true, data: { level: hint.hintLevel, text: hint.hintText, deduction: hint.deductionScore } };
}

// ---------------------------------------------------------------------------------------------
// Scoring & achievements
// ---------------------------------------------------------------------------------------------

/**
 * score_earned (per completed stage) = max_score − hint deductions on that stage.
 * final_score = Σ score_earned − deductions on stages not completed yet (never below 0).
 * This matches the original rule: 100 per solved challenge, −25 per hint.
 */
async function recomputeScore(tx: Tx, sessionId: number) {
  const [progress, usages] = await Promise.all([
    tx.stageProgress.findMany({ where: { sessionId }, include: { stage: { select: { maxScore: true } } } }),
    tx.hintUsage.findMany({ where: { sessionId }, select: { scoreDeducted: true, hint: { select: { puzzle: { select: { stageId: true } } } } } }),
  ]);
  const deductions = new Map<number, number>();
  for (const usage of usages) {
    const stageId = usage.hint.puzzle.stageId;
    deductions.set(stageId, (deductions.get(stageId) ?? 0) + usage.scoreDeducted);
  }
  let total = 0;
  for (const p of progress) {
    const deducted = deductions.get(p.stageId) ?? 0;
    if (p.status !== PROGRESS_STATUS.completed) { total -= deducted; continue; }
    const earned = Math.max(0, p.stage.maxScore - deducted);
    if (earned !== p.scoreEarned) await tx.stageProgress.update({ where: { progressId: p.progressId }, data: { scoreEarned: earned } });
    total += earned;
  }
  await tx.gameSession.update({ where: { sessionId }, data: { finalScore: Math.max(0, total) } });
}

/** Evaluates the rules behind achievement.criteria_condition and returns the codes unlocked just now. */
async function awardAchievements(tx: Tx, userId: number, sessionId: number) {
  const session = await tx.gameSession.findUniqueOrThrow({ where: { sessionId }, include: { _count: { select: { hintUsages: true } } } });
  const earned: (typeof AUTO_ACHIEVEMENTS)[number][] = ["FIRST_FLAG"];
  if (session.status === SESSION_STATUS.completed) {
    earned.push("ROOM_CLEARED");
    if (session._count.hintUsages === 0) earned.push("NO_HINTS");
    if ((await tx.puzzleAttempt.count({ where: { sessionId, isCorrect: false } })) === 0) earned.push("FLAWLESS");
    if (session.endedAt && session.endedAt.getTime() - session.startedAt.getTime() <= SPEEDRUN_MS) earned.push("SPEEDRUN");
  }
  const candidates = await tx.achievement.findMany({ where: { achievementCode: { in: earned } }, include: { users: { where: { userId }, select: { userId: true } } } });
  const fresh = candidates.filter(a => a.users.length === 0);
  if (fresh.length) await tx.userAchievement.createMany({ data: fresh.map(a => ({ userId, achievementId: a.achievementId })), skipDuplicates: true });
  return fresh.map(a => a.achievementName);
}
