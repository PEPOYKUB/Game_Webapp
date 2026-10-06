import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { categorySpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const PATCH = adminRoute(async ({ id, body }) => {
  const parsed = parseFields(body, categorySpec, { partial: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  return ok({ category: await db.category.update({ where: { categoryId: id! }, data: parsed.data }) });
}, "categoryId");

// DELETE — also removes its room_category links (rooms themselves are untouched).
export const DELETE = adminRoute(async ({ id }) => {
  await db.category.delete({ where: { categoryId: id! } });
  return ok({ deleted: true });
}, "categoryId");
