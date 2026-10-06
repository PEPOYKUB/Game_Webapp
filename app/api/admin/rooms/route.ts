import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { parseCategoryIds, roomSpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => {
  const rooms = await db.room.findMany({ orderBy: { roomId: "asc" }, include: { categories: { select: { categoryId: true } }, _count: { select: { stages: true, sessions: true } } } });
  return ok({ rooms });
});

// POST { roomCode, roomName, description?, difficultyLevel, isActive?, categoryIds? }
export const POST = adminRoute(async ({ admin, body }) => {
  const parsed = parseFields(body, roomSpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const categoryIds = parseCategoryIds((body as Record<string, unknown>).categoryIds);
  if (categoryIds === null) return jsonError("categoryIds must be a list of category ids", 400);
  const { roomCode, roomName, difficultyLevel, description, isActive } = parsed.data;
  const room = await db.room.create({
    data: {
      roomCode: roomCode!, roomName: roomName!, difficultyLevel: difficultyLevel!, description: description ?? null, isActive: isActive ?? true, createdBy: admin.userId,
      categories: { create: (categoryIds ?? []).map(categoryId => ({ categoryId })) },
    },
  });
  return ok({ room }, 201);
});
