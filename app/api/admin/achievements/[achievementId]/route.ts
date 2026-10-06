import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { achievementSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const PATCH = adminRoute(async ({ id, body }) => {
  const parsed = parseFields(body, achievementSpec, { partial: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  return ok({ achievement: await db.achievement.update({ where: { achievementId: id! }, data: parsed.data }) });
}, "achievementId");

// DELETE — also removes everyone's user_achievement rows for it.
export const DELETE = adminRoute(async ({ id }) => {
  await db.achievement.delete({ where: { achievementId: id! } });
  return ok({ deleted: true });
}, "achievementId");
