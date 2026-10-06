// Idempotent seed: faculties, categories, achievements, the 5-stage default room and (optionally) the admin.
// Run with `npm run db:seed`. Safe to re-run — e.g. after changing FLAG_SECRET to refresh answer hashes.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd()); // same .env / .env.local resolution as Next.js, so FLAG_SECRET matches the app

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BONUS_ROOM, challenges, DEFAULT_ROOM, HINT_PENALTY, POINTS_PER_CHALLENGE } from "../lib/challenges";
import { ROLE, USER_STATUS } from "../lib/constants";
import { buildAnswerHash, type FlagKey } from "../lib/flags";

const db = new PrismaClient();

const faculties = [
  ["AG", "คณะเกษตรศาสตร์", "Faculty of Agriculture"],
  ["AR", "คณะสถาปัตยกรรมศาสตร์", "Faculty of Architecture"],
  ["BS", "คณะบริหารธุรกิจและการบัญชี", "Faculty of Business Administration and Accountancy"],
  ["CP", "วิทยาลัยการคอมพิวเตอร์", "College of Computing"],
  ["DE", "คณะทันตแพทยศาสตร์", "Faculty of Dentistry"],
  ["ED", "คณะศึกษาศาสตร์", "Faculty of Education"],
  ["EN", "คณะวิศวกรรมศาสตร์", "Faculty of Engineering"],
  ["FA", "คณะศิลปกรรมศาสตร์", "Faculty of Fine and Applied Arts"],
  ["HS", "คณะมนุษยศาสตร์และสังคมศาสตร์", "Faculty of Humanities and Social Sciences"],
  ["LW", "คณะนิติศาสตร์", "Faculty of Law"],
  ["MD", "คณะแพทยศาสตร์", "Faculty of Medicine"],
  ["NS", "คณะพยาบาลศาสตร์", "Faculty of Nursing"],
  ["PH", "คณะเภสัชศาสตร์", "Faculty of Pharmaceutical Sciences"],
  ["SC", "คณะวิทยาศาสตร์", "Faculty of Science"],
  ["TE", "คณะเทคนิคการแพทย์", "Faculty of Associated Medical Sciences"],
  ["XX", "บุคคลภายนอก / อื่น ๆ", "External / Other"],
] as const;

const categoryDescriptions: Record<string, string> = {
  "Web Security": "ช่องโหว่ของเว็บแอปพลิเคชันและ API",
  "Access Control": "การตรวจสิทธิ์เข้าถึงข้อมูลและฟังก์ชัน",
  "Information Disclosure": "ข้อมูลภายในรั่วไหลผ่าน response",
  "Server-Side": "ช่องโหว่ที่เกิดจากการทำงานฝั่ง server (simulation)",
};

const achievements = [
  { code: "FIRST_FLAG", name: "First Blood", description: "ส่ง Flag ถูกเป็นครั้งแรก", icon: "/badges/first-flag.svg", criteria: "puzzle_attempt.is_correct = true count >= 1" },
  { code: "ROOM_CLEARED", name: "Case Closed", description: "ผ่านครบทุกด่านในห้อง", icon: "/badges/room-cleared.svg", criteria: "game_session.status = 'completed'" },
  { code: "NO_HINTS", name: "No Help Needed", description: "จบห้องโดยไม่ใช้ Hint เลย", icon: "/badges/no-hints.svg", criteria: "game_session completed AND hint_usage count = 0" },
  { code: "FLAWLESS", name: "Flawless", description: "จบห้องโดยไม่ส่งคำตอบผิดเลย", icon: "/badges/flawless.svg", criteria: "game_session completed AND puzzle_attempt.is_correct = false count = 0" },
  { code: "SPEEDRUN", name: "Speedrunner", description: "จบห้องภายใน 30 นาที", icon: "/badges/speedrun.svg", criteria: "game_session completed AND ended_at - started_at <= 30 minutes" },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return console.log("• ADMIN_EMAIL not set — no admin promoted");
  const existing = await db.appUser.findUnique({ where: { email } });
  if (existing) {
    await db.appUser.update({ where: { email }, data: { role: ROLE.admin, status: USER_STATUS.active } });
    return console.log(`• promoted ${email} to admin`);
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) return console.log(`• ${email} has not registered yet — register it at /register, then re-run the seed (or set ADMIN_PASSWORD to create it now)`);
  await db.appUser.create({ data: { email, username: email.split("@")[0].replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40) || "admin", passwordHash: await bcrypt.hash(password, 12), firstName: "Game", lastName: "Admin", role: ROLE.admin, status: USER_STATUS.active } });
  console.log(`• created admin account ${email}`);
}

type SeedStage = { flagKey: FlagKey; type: string; tag: string; title: string; text: string; target: string; explanation: string; hints: readonly string[] };
type SeedRoom = { code: string; name: string; description: string; difficulty: string; categories: readonly string[] };

async function seedRoom(spec: SeedRoom, stages: readonly SeedStage[], createdBy: number | null) {
  const roomData = { roomName: spec.name, description: spec.description, difficultyLevel: spec.difficulty };
  const room = await db.room.upsert({ where: { roomCode: spec.code }, update: roomData, create: { roomCode: spec.code, ...roomData, isActive: true, createdBy } });

  for (const name of spec.categories) {
    const category = await db.category.findUniqueOrThrow({ where: { categoryName: name } });
    await db.roomCategory.upsert({ where: { roomId_categoryId: { roomId: room.roomId, categoryId: category.categoryId } }, update: {}, create: { roomId: room.roomId, categoryId: category.categoryId } });
  }

  for (const [index, item] of stages.entries()) {
    const stageNumber = index + 1;
    const stageData = { stageName: item.tag, storylineText: item.target, maxScore: POINTS_PER_CHALLENGE };
    const stage = await db.stage.upsert({ where: { roomId_stageNumber: { roomId: room.roomId, stageNumber } }, update: stageData, create: { roomId: room.roomId, stageNumber, ...stageData } });

    // Only a keyed hash of the flag is stored ("flag:<key>$<hmac>"); the flag itself is never written anywhere.
    const puzzleData = { puzzleTitle: item.title, questionText: item.text, puzzleType: item.type, correctAnswerHash: buildAnswerHash({ flagKey: item.flagKey }), explanationText: item.explanation };
    const existing = await db.puzzle.findFirst({ where: { stageId: stage.stageId }, orderBy: { puzzleId: "asc" } });
    const puzzle = existing ? await db.puzzle.update({ where: { puzzleId: existing.puzzleId }, data: puzzleData }) : await db.puzzle.create({ data: { stageId: stage.stageId, ...puzzleData } });

    for (const [hintIndex, hintText] of item.hints.entries()) {
      const hintLevel = hintIndex + 1;
      const hintData = { hintText, deductionScore: HINT_PENALTY * hintLevel };
      await db.hint.upsert({ where: { puzzleId_hintLevel: { puzzleId: puzzle.puzzleId, hintLevel } }, update: hintData, create: { puzzleId: puzzle.puzzleId, hintLevel, ...hintData } });
    }
  }
  console.log(`• room ${spec.code}: ${stages.length} stage(s) with puzzles and hints`);
}

async function main() {
  if (!process.env.FLAG_SECRET) console.warn("! FLAG_SECRET is not set — answer hashes use the public dev secret (local testing only)");

  for (const [facultyCode, facultyNameTh, facultyNameEn] of faculties) {
    await db.faculty.upsert({ where: { facultyCode }, update: { facultyNameTh, facultyNameEn }, create: { facultyCode, facultyNameTh, facultyNameEn } });
  }
  for (const [categoryName, categoryDescription] of Object.entries(categoryDescriptions)) {
    await db.category.upsert({ where: { categoryName }, update: { categoryDescription }, create: { categoryName, categoryDescription } });
  }
  for (const a of achievements) {
    const data = { achievementName: a.name, description: a.description, badgeIconUrl: a.icon, criteriaCondition: a.criteria };
    await db.achievement.upsert({ where: { achievementCode: a.code }, update: data, create: { achievementCode: a.code, ...data } });
  }
  console.log(`• ${faculties.length} faculties, ${Object.keys(categoryDescriptions).length} categories, ${achievements.length} achievements`);

  await seedAdmin();
  const admin = await db.appUser.findFirst({ where: { role: ROLE.admin }, orderBy: { userId: "asc" }, select: { userId: true } });

  const defaultStages = challenges.map(c => ({ ...c, hints: [c.hint] }));
  await seedRoom(DEFAULT_ROOM, defaultStages, admin?.userId ?? null);
  await seedRoom(BONUS_ROOM, BONUS_ROOM.stages, admin?.userId ?? null);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
