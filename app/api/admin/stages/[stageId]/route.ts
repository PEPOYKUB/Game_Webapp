import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { stageSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const PATCH = adminRoute(async ({ id, body }) => {
  const parsed = parseFields(body, stageSpec, { partial: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  return ok({ stage: await db.stage.update({ where: { stageId: id! }, data: parsed.data }) });
}, "stageId");

// DELETE — refused once any session has progress on the stage, so play history is never lost.
export const DELETE = adminRoute(async ({ id }) => {
  const progress = await db.stageProgress.count({ where: { stageId: id! } });
  if (progress > 0) return jsonError(`Players already have progress on this stage (${progress}) — it cannot be deleted`, 409);
  await db.stage.delete({ where: { stageId: id! } });
  return ok({ deleted: true });
}, "stageId");
