// Server-only read queries for the leaderboard and analytics.
// Nothing here selects password_hash or correct_answer_hash.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PROGRESS_STATUS, ROLE, SESSION_STATUS, USER_STATUS } from "@/lib/constants";
import { positiveInt } from "@/lib/validation";

export type StatsFilters = { roomId?: number | null; facultyId?: number | null; yearLevel?: number | null };

/** Reads ?roomId=&facultyId=&yearLevel= from a URLSearchParams or a Next.js searchParams object. */
export function parseFilters(params: URLSearchParams | Record<string, string | string[] | undefined>): StatsFilters {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return Array.isArray(value) ? value[0] : value ?? null;
  };
  const yearLevel = positiveInt(get("yearLevel"));
  return { roomId: positiveInt(get("roomId")), facultyId: positiveInt(get("facultyId")), yearLevel: yearLevel && yearLevel <= 8 ? yearLevel : null };
}

function sessionWhere({ roomId, facultyId, yearLevel }: StatsFilters): Prisma.GameSessionWhereInput {
  return {
    ...(roomId && { roomId }),
    ...((facultyId || yearLevel) && { user: { ...(facultyId && { facultyId }), ...(yearLevel && { yearLevel }) } }),
  };
}

const durationMs = (s: { startedAt: Date; endedAt: Date | null }) => (s.endedAt ? s.endedAt.getTime() - s.startedAt.getTime() : null);
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export async function getFilterOptions() {
  const [rooms, faculties] = await Promise.all([
    db.room.findMany({ orderBy: { roomId: "asc" }, select: { roomId: true, roomCode: true, roomName: true } }),
    db.faculty.findMany({ orderBy: { facultyCode: "asc" }, select: { facultyId: true, facultyCode: true, facultyNameEn: true } }),
  ]);
  return { rooms, faculties, yearLevels: [1, 2, 3, 4, 5, 6, 7, 8] };
}

/** Best completed run per player and room: highest score first, then fastest time. */
export async function getLeaderboard(filters: StatsFilters = {}, limit = 50) {
  const sessions = await db.gameSession.findMany({
    where: {
      ...(filters.roomId && { roomId: filters.roomId }),
      status: SESSION_STATUS.completed,
      // Ranks players only; admins testing the game and suspended accounts are left out.
      user: { status: USER_STATUS.active, role: ROLE.player, ...(filters.facultyId && { facultyId: filters.facultyId }), ...(filters.yearLevel && { yearLevel: filters.yearLevel }) },
    },
    select: {
      sessionId: true, userId: true, roomId: true, finalScore: true, startedAt: true, endedAt: true,
      user: { select: { username: true, yearLevel: true, faculty: { select: { facultyCode: true } } } },
      room: { select: { roomCode: true } },
      _count: { select: { hintUsages: true, attempts: true } },
    },
  });
  const rows = sessions
    .map(s => ({ sessionId: s.sessionId, userId: s.userId, roomId: s.roomId, username: s.user.username, faculty: s.user.faculty?.facultyCode ?? null, yearLevel: s.user.yearLevel, room: s.room.roomCode, score: s.finalScore, durationMs: durationMs(s) ?? Number.MAX_SAFE_INTEGER, hints: s._count.hintUsages, attempts: s._count.attempts, endedAt: s.endedAt }))
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs || a.sessionId - b.sessionId);
  const seen = new Set<string>();
  return rows
    .filter(row => {
      const key = `${row.userId}:${row.roomId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getAdminOverview(filters: StatsFilters = {}) {
  const where = sessionWhere(filters);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [usersByRole, suspended, newUsers, sessionsByStatus, attemptsByResult, hintTotals, completedSessions, startedPlayers, finishedPlayers] = await Promise.all([
    db.appUser.groupBy({ by: ["role"], _count: { _all: true } }),
    db.appUser.count({ where: { status: USER_STATUS.suspended } }),
    db.appUser.count({ where: { createdAt: { gte: weekAgo } } }),
    db.gameSession.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.puzzleAttempt.groupBy({ by: ["isCorrect"], where: { session: where }, _count: { _all: true } }),
    db.hintUsage.aggregate({ where: { session: where }, _count: { _all: true }, _sum: { scoreDeducted: true } }),
    db.gameSession.findMany({ where: { ...where, status: SESSION_STATUS.completed }, select: { finalScore: true, startedAt: true, endedAt: true } }),
    db.gameSession.findMany({ where, distinct: ["userId"], select: { userId: true } }),
    db.gameSession.findMany({ where: { ...where, status: SESSION_STATUS.completed }, distinct: ["userId"], select: { userId: true } }),
  ]);
  const sessionCount = (status: string) => sessionsByStatus.find(r => r.status === status)?._count._all ?? 0;
  const totalSessions = sessionsByStatus.reduce((sum, r) => sum + r._count._all, 0);
  const correct = attemptsByResult.find(r => r.isCorrect)?._count._all ?? 0;
  const wrong = attemptsByResult.find(r => !r.isCorrect)?._count._all ?? 0;
  const durations = completedSessions.map(durationMs).filter((d): d is number => d !== null);
  const userCount = (role: string) => usersByRole.find(r => r.role === role)?._count._all ?? 0;

  return {
    users: { total: usersByRole.reduce((sum, r) => sum + r._count._all, 0), players: userCount(ROLE.player), admins: userCount(ROLE.admin), suspended, newThisWeek: newUsers },
    playersStarted: startedPlayers.length,
    playersFinished: finishedPlayers.length,
    sessions: { total: totalSessions, active: sessionCount(SESSION_STATUS.active), completed: sessionCount(SESSION_STATUS.completed), abandoned: sessionCount(SESSION_STATUS.abandoned) },
    completionRate: totalSessions ? sessionCount(SESSION_STATUS.completed) / totalSessions : null,
    playerCompletionRate: startedPlayers.length ? finishedPlayers.length / startedPlayers.length : null,
    attempts: { total: correct + wrong, correct, wrong, accuracy: correct + wrong ? correct / (correct + wrong) : null },
    hints: { used: hintTotals._count._all, pointsDeducted: hintTotals._sum.scoreDeducted ?? 0 },
    averageScore: average(completedSessions.map(s => s.finalScore)),
    highestScore: completedSessions.length ? Math.max(...completedSessions.map(s => s.finalScore)) : null,
    averageDurationMs: average(durations),
    fastestDurationMs: durations.length ? Math.min(...durations) : null,
  };
}

/**
 * Stage pass rates, most-failed stages, slowest puzzles and most-used hints.
 * Solve time of a puzzle = first correct attempt − stage_progress.started_at of that session.
 */
export async function getAnalytics(filters: StatsFilters = {}) {
  const where = sessionWhere(filters);
  const [stages, progress, attempts, hintUsages] = await Promise.all([
    db.stage.findMany({
      where: filters.roomId ? { roomId: filters.roomId } : {},
      orderBy: [{ roomId: "asc" }, { stageNumber: "asc" }],
      select: { stageId: true, stageNumber: true, stageName: true, room: { select: { roomCode: true } }, puzzles: { select: { puzzleId: true, puzzleTitle: true, puzzleType: true, hints: { select: { hintId: true, hintLevel: true, hintText: true, deductionScore: true } } } } },
    }),
    db.stageProgress.findMany({ where: { session: where }, select: { sessionId: true, stageId: true, status: true, startedAt: true, completedAt: true } }),
    db.puzzleAttempt.findMany({ where: { session: where }, orderBy: { attemptedAt: "asc" }, select: { sessionId: true, puzzleId: true, isCorrect: true, attemptedAt: true } }),
    db.hintUsage.groupBy({ by: ["hintId"], where: { session: where }, _count: { _all: true } }),
  ]);

  const stageStartedAt = new Map(progress.map(p => [`${p.sessionId}:${p.stageId}`, p.startedAt]));
  const hintUses = new Map(hintUsages.map(h => [h.hintId, h._count._all]));

  const puzzleRows = stages.flatMap(stage => stage.puzzles.map(puzzle => {
    const own = attempts.filter(a => a.puzzleId === puzzle.puzzleId);
    const firstCorrect = new Map<number, Date>();
    for (const a of own) if (a.isCorrect && !firstCorrect.has(a.sessionId)) firstCorrect.set(a.sessionId, a.attemptedAt);
    const solveTimes = [...firstCorrect].flatMap(([sessionId, at]) => {
      const started = stageStartedAt.get(`${sessionId}:${stage.stageId}`);
      return started ? [at.getTime() - started.getTime()] : [];
    });
    return {
      puzzleId: puzzle.puzzleId, title: puzzle.puzzleTitle, type: puzzle.puzzleType, room: stage.room.roomCode, stageNumber: stage.stageNumber,
      attempts: own.length, wrong: own.filter(a => !a.isCorrect).length, solves: firstCorrect.size,
      averageSolveMs: average(solveTimes), slowestSolveMs: solveTimes.length ? Math.max(...solveTimes) : null,
    };
  }));

  const stageRows = stages.map(stage => {
    const own = progress.filter(p => p.stageId === stage.stageId);
    const reached = own.filter(p => p.status !== PROGRESS_STATUS.locked).length;
    const cleared = own.filter(p => p.status === PROGRESS_STATUS.completed);
    const puzzles = puzzleRows.filter(p => stage.puzzles.some(sp => sp.puzzleId === p.puzzleId));
    const clearTimes = cleared.flatMap(p => (p.startedAt && p.completedAt ? [p.completedAt.getTime() - p.startedAt.getTime()] : []));
    const attemptsTotal = puzzles.reduce((sum, p) => sum + p.attempts, 0);
    const wrong = puzzles.reduce((sum, p) => sum + p.wrong, 0);
    return {
      stageId: stage.stageId, room: stage.room.roomCode, number: stage.stageNumber, name: stage.stageName, type: stage.puzzles[0]?.puzzleType ?? "—",
      reached, cleared: cleared.length, passRate: reached ? cleared.length / reached : null,
      attempts: attemptsTotal, wrong, wrongRate: attemptsTotal ? wrong / attemptsTotal : null,
      hintsUsed: stage.puzzles.reduce((sum, p) => sum + p.hints.reduce((s, h) => s + (hintUses.get(h.hintId) ?? 0), 0), 0),
      averageClearMs: average(clearTimes),
    };
  });

  const hintRows = stages.flatMap(stage => stage.puzzles.flatMap(puzzle => puzzle.hints.map(hint => ({
    hintId: hint.hintId, room: stage.room.roomCode, stageNumber: stage.stageNumber, puzzle: puzzle.puzzleTitle, level: hint.hintLevel, text: hint.hintText, deduction: hint.deductionScore, uses: hintUses.get(hint.hintId) ?? 0,
  }))));

  return {
    stages: stageRows,
    mostFailedStages: [...stageRows].filter(s => s.wrong > 0).sort((a, b) => b.wrong - a.wrong).slice(0, 10),
    slowestPuzzles: [...puzzleRows].filter(p => p.averageSolveMs !== null).sort((a, b) => (b.averageSolveMs ?? 0) - (a.averageSolveMs ?? 0)).slice(0, 10),
    topHints: [...hintRows].filter(h => h.uses > 0).sort((a, b) => b.uses - a.uses).slice(0, 10),
    puzzles: puzzleRows,
  };
}

export async function getFacultyBreakdown() {
  const faculties = await db.faculty.findMany({
    orderBy: { facultyCode: "asc" },
    select: { facultyCode: true, facultyNameEn: true, users: { select: { sessions: { where: { status: SESSION_STATUS.completed }, select: { sessionId: true }, take: 1 } } } },
  });
  const unassigned = await db.appUser.count({ where: { facultyId: null } });
  return {
    faculties: faculties.map(f => ({ code: f.facultyCode, name: f.facultyNameEn, users: f.users.length, finishers: f.users.filter(u => u.sessions.length > 0).length })).filter(f => f.users > 0),
    unassigned,
  };
}
