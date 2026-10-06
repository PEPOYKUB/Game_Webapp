import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { hintSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

// PATCH — changing deduction_score affects future usages only; recorded hint_usage.score_deducted stays as charged.
export const PATCH = adminRoute(async ({ id, body }) => {
  const parsed = parseFields(body, hintSpec, { partial: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  return ok({ hint: await db.hint.update({ where: { hintId: id! }, data: parsed.data }) });
}, "hintId");

// DELETE — refused once the hint has been used (hint_usage.hint_id is ON DELETE RESTRICT).
export const DELETE = adminRoute(async ({ id }) => {
  const usages = await db.hintUsage.count({ where: { hintId: id! } });
  if (usages > 0) return jsonError(`This hint was used ${usages} time(s) — it cannot be deleted`, 409);
  await db.hint.delete({ where: { hintId: id! } });
  return ok({ deleted: true });
}, "hintId");
