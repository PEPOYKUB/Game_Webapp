// Server-only list/detail queries for the admin dashboard. Callers must check the ADMIN role first.
// password_hash and correct_answer_hash are never selected (puzzles expose only the answer *source*).
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PROGRESS_STATUS, ROLE, SESSION_STATUS, USER_STATUS } from "@/lib/constants";
import { answerSource } from "@/lib/flags";
import { positiveInt } from "@/lib/validation";

export const PAGE_SIZE = 25;
type Params = Record<string, string | string[] | undefined>;

const param = (params: Params, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
};
const pageOf = (params: Params) => positiveInt(param(params, "page")) ?? 1;
const paging = (total: number, page: number) => ({ total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });

export async function listUsers(params: Params) {
  const q = param(params, "q").slice(0, 100);
  const role = param(params, "role");
  const status = param(params, "status");
  const facultyId = positiveInt(param(params, "facultyId"));
  const yearLevel = positiveInt(param(params, "yearLevel"));
  const where: Prisma.AppUserWhereInput = {
    ...(q && { OR: [{ username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { studentId: { contains: q } }] }),
    ...(Object.values(ROLE).includes(role as never) && { role }),
    ...(Object.values(USER_STATUS).includes(status as never) && { status }),
    ...(facultyId && { facultyId }),
    ...(yearLevel && { yearLevel }),
  };
  const page = pageOf(params);
  const [total, users] = await Promise.all([
    db.appUser.count({ where }),
    db.appUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        userId: true, username: true, email: true, firstName: true, lastName: true, studentId: true, yearLevel: true, role: true, status: true, createdAt: true,
        faculty: { select: { facultyCode: true } },
        sessions: { select: { status: true, finalScore: true } },
        _count: { select: { achievements: true } },
      },
    }),
  ]);
  return {
    ...paging(total, page),
    users: users.map(({ sessions, _count, faculty, ...user }) => {
      const completed = sessions.filter(s => s.status === SESSION_STATUS.completed);
      return { ...user, faculty: faculty?.facultyCode ?? null, sessions: sessions.length, completed: completed.length, bestScore: completed.length ? Math.max(...completed.map(s => s.finalScore)) : null, achievements: _count.achievements };
    }),
  };
}

export async function listSessions(params: Params) {
  const status = param(params, "status");
  const roomId = positiveInt(param(params, "roomId"));
  const where: Prisma.GameSessionWhereInput = { ...(Object.values(SESSION_STATUS).includes(status as never) && { status }), ...(roomId && { roomId }) };
  const page = pageOf(params);
  const [total, sessions] = await Promise.all([
    db.gameSession.count({ where }),
    db.gameSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        sessionId: true, status: true, finalScore: true, startedAt: true, endedAt: true,
        user: { select: { username: true } },
        room: { select: { roomCode: true } },
        progress: { select: { status: true } },
        _count: { select: { attempts: true, hintUsages: true } },
      },
    }),
  ]);
  return {
    ...paging(total, page),
    sessions: sessions.map(({ progress, _count, user, room, ...s }) => ({ ...s, username: user.username, room: room.roomCode, stagesCleared: progress.filter(p => p.status === PROGRESS_STATUS.completed).length, stagesTotal: progress.length, attempts: _count.attempts, hints: _count.hintUsages })),
  };
}

export async function listAttempts(params: Params) {
  const result = param(params, "result");
  const roomId = positiveInt(param(params, "roomId"));
  const q = param(params, "q").slice(0, 50);
  const where: Prisma.PuzzleAttemptWhereInput = {
    ...(result === "correct" && { isCorrect: true }),
    ...(result === "wrong" && { isCorrect: false }),
    ...((roomId || q) && { session: { ...(roomId && { roomId }), ...(q && { user: { username: { contains: q, mode: "insensitive" } } }) } }),
  };
  const page = pageOf(params);
  const [total, attempts] = await Promise.all([
    db.puzzleAttempt.count({ where }),
    db.puzzleAttempt.findMany({
      where,
      orderBy: { attemptedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        attemptId: true, submittedAnswer: true, isCorrect: true, attemptedAt: true,
        puzzle: { select: { puzzleTitle: true, stage: { select: { stageNumber: true, room: { select: { roomCode: true } } } } } },
        session: { select: { sessionId: true, user: { select: { username: true } } } },
      },
    }),
  ]);
  return { ...paging(total, page), attempts };
}

export function listRooms() {
  return db.room.findMany({
    orderBy: { roomId: "asc" },
    select: {
      roomId: true, roomCode: true, roomName: true, description: true, difficultyLevel: true, isActive: true, createdAt: true,
      creator: { select: { username: true } },
      categories: { select: { categoryId: true, category: { select: { categoryName: true } } } },
      _count: { select: { stages: true, sessions: true } },
    },
  });
}

export function listCategories() {
  return db.category.findMany({ orderBy: { categoryName: "asc" }, select: { categoryId: true, categoryName: true, categoryDescription: true, _count: { select: { rooms: true } } } });
}

export function listStages(roomId?: number | null) {
  return db.stage.findMany({
    where: roomId ? { roomId } : {},
    orderBy: [{ roomId: "asc" }, { stageNumber: "asc" }],
    select: { stageId: true, roomId: true, stageNumber: true, stageName: true, storylineText: true, maxScore: true, room: { select: { roomCode: true } }, _count: { select: { puzzles: true, progress: true } } },
  });
}

export async function listPuzzles(stageId?: number | null) {
  const puzzles = await db.puzzle.findMany({
    where: stageId ? { stageId } : {},
    orderBy: [{ stage: { roomId: "asc" } }, { stage: { stageNumber: "asc" } }, { puzzleId: "asc" }],
    select: {
      puzzleId: true, stageId: true, puzzleTitle: true, questionText: true, puzzleType: true, explanationText: true, correctAnswerHash: true,
      stage: { select: { stageNumber: true, room: { select: { roomCode: true } } } },
      _count: { select: { hints: true, attempts: true } },
    },
  });
  // Swap the hash for its source label before anything leaves this module.
  return puzzles.map(({ correctAnswerHash, ...p }) => ({ ...p, answerSource: answerSource(correctAnswerHash) }));
}

export function listHints(puzzleId?: number | null) {
  return db.hint.findMany({
    where: puzzleId ? { puzzleId } : {},
    orderBy: [{ puzzle: { stage: { roomId: "asc" } } }, { puzzle: { stage: { stageNumber: "asc" } } }, { puzzleId: "asc" }, { hintLevel: "asc" }],
    select: { hintId: true, puzzleId: true, hintLevel: true, hintText: true, deductionScore: true, puzzle: { select: { puzzleTitle: true, stage: { select: { stageNumber: true, room: { select: { roomCode: true } } } } } }, _count: { select: { usages: true } } },
  });
}

export function listAchievements() {
  return db.achievement.findMany({
    orderBy: { achievementId: "asc" },
    select: { achievementId: true, achievementCode: true, achievementName: true, description: true, badgeIconUrl: true, criteriaCondition: true, _count: { select: { users: true } }, users: { orderBy: { unlockedAt: "desc" }, take: 5, select: { unlockedAt: true, user: { select: { username: true } } } } },
  });
}

/** Lightweight id/label lists for <select> inputs. */
export async function getPickers() {
  const [rooms, stages, puzzles] = await Promise.all([
    db.room.findMany({ orderBy: { roomId: "asc" }, select: { roomId: true, roomCode: true } }),
    db.stage.findMany({ orderBy: [{ roomId: "asc" }, { stageNumber: "asc" }], select: { stageId: true, stageNumber: true, room: { select: { roomCode: true } } } }),
    db.puzzle.findMany({ orderBy: [{ stage: { roomId: "asc" } }, { stage: { stageNumber: "asc" } }], select: { puzzleId: true, puzzleTitle: true, stage: { select: { stageNumber: true, room: { select: { roomCode: true } } } } } }),
  ]);
  return {
    rooms: rooms.map(r => ({ value: String(r.roomId), label: r.roomCode })),
    stages: stages.map(s => ({ value: String(s.stageId), label: `${s.room.roomCode} · Stage ${s.stageNumber}` })),
    puzzles: puzzles.map(p => ({ value: String(p.puzzleId), label: `${p.stage.room.roomCode} · S${p.stage.stageNumber} · ${p.puzzleTitle}` })),
  };
}
