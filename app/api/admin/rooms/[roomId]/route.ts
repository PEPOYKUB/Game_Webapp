import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { parseCategoryIds, roomSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

// PATCH { roomCode?, roomName?, description?, difficultyLevel?, isActive?, categoryIds? } — categoryIds replaces the set.
export const PATCH = adminRoute(async ({ id, body }) => {
  const categoryIds = parseCategoryIds((body as Record<string, unknown> | null)?.categoryIds);
  if (categoryIds === null) return jsonError("categoryIds must be a list of category ids", 400);
  const parsed = parseFields(body, roomSpec, { partial: true });
  if (parsed.error && !(categoryIds && parsed.error === "Nothing to update")) return jsonError(parsed.error, 400);
  const room = await db.$transaction(async tx => {
    const updated = await tx.room.update({ where: { roomId: id! }, data: parsed.data ?? {} });
    if (categoryIds) {
      await tx.roomCategory.deleteMany({ where: { roomId: id!, categoryId: { notIn: categoryIds } } });
      await tx.roomCategory.createMany({ data: categoryIds.map(categoryId => ({ roomId: id!, categoryId })), skipDuplicates: true });
    }
    return updated;
  });
  return ok({ room });
}, "roomId");

// DELETE — only rooms nobody has played (game_session.room_id is ON DELETE RESTRICT).
export const DELETE = adminRoute(async ({ id }) => {
  const sessions = await db.gameSession.count({ where: { roomId: id! } });
  if (sessions > 0) return jsonError(`This room has ${sessions} game session(s) — deactivate it instead of deleting`, 409);
  await db.room.delete({ where: { roomId: id! } });
  return ok({ deleted: true });
}, "roomId");
