import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { achievementSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ok({ achievements: await db.achievement.findMany({ orderBy: { achievementId: "asc" }, include: { _count: { select: { users: true } } } }) }));

// POST { achievementCode, achievementName, description?, badgeIconUrl?, criteriaCondition? }
export const POST = adminRoute(async ({ body }) => {
  const parsed = parseFields(body, achievementSpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const { achievementCode, achievementName, description, badgeIconUrl, criteriaCondition } = parsed.data;
  const achievement = await db.achievement.create({ data: { achievementCode: achievementCode!, achievementName: achievementName!, description: description ?? null, badgeIconUrl: badgeIconUrl ?? null, criteriaCondition: criteriaCondition ?? null } });
  return ok({ achievement }, 201);
});
