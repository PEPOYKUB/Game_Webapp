import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";

async function findUser(body: unknown) {
  const username = typeof (body as { username?: unknown } | null)?.username === "string" ? (body as { username: string }).username.trim() : "";
  if (!username || username.length > 50) return null;
  return db.appUser.findFirst({ where: { username: { equals: username, mode: "insensitive" } }, select: { userId: true, username: true } });
}

// POST { username } — grant manually (for achievements without an automatic rule).
export const POST = adminRoute(async ({ id, body }) => {
  const user = await findUser(body);
  if (!user) return jsonError("Unknown username", 404);
  await db.userAchievement.upsert({ where: { userId_achievementId: { userId: user.userId, achievementId: id! } }, update: {}, create: { userId: user.userId, achievementId: id! } });
  return ok({ awarded: user.username });
}, "achievementId");

// DELETE { username } — revoke.
export const DELETE = adminRoute(async ({ id, body }) => {
  const user = await findUser(body);
  if (!user) return jsonError("Unknown username", 404);
  await db.userAchievement.deleteMany({ where: { userId: user.userId, achievementId: id! } });
  return ok({ revoked: user.username });
}, "achievementId");
