import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { stageSpec } from "@/lib/admin-specs";
import { parseFields, positiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET ?roomId=
export const GET = adminRoute(async ({ request }) => {
  const roomId = positiveInt(request.nextUrl.searchParams.get("roomId"));
  const stages = await db.stage.findMany({ where: roomId ? { roomId } : {}, orderBy: [{ roomId: "asc" }, { stageNumber: "asc" }], include: { _count: { select: { puzzles: true, progress: true } } } });
  return ok({ stages });
});

// POST { roomId, stageNumber, stageName, storylineText?, maxScore }
export const POST = adminRoute(async ({ body }) => {
  const parsed = parseFields(body, stageSpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const { roomId, stageNumber, stageName, storylineText, maxScore } = parsed.data;
  const stage = await db.stage.create({ data: { roomId: roomId!, stageNumber: stageNumber!, stageName: stageName!, storylineText: storylineText ?? null, maxScore: maxScore! } });
  return ok({ stage }, 201);
});
