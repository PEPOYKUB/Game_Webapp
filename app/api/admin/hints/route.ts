import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { hintSpec } from "@/lib/admin-specs";
import { parseFields, positiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET ?puzzleId=
export const GET = adminRoute(async ({ request }) => {
  const puzzleId = positiveInt(request.nextUrl.searchParams.get("puzzleId"));
  const hints = await db.hint.findMany({ where: puzzleId ? { puzzleId } : {}, orderBy: [{ puzzleId: "asc" }, { hintLevel: "asc" }], include: { _count: { select: { usages: true } } } });
  return ok({ hints });
});

// POST { puzzleId, hintLevel, hintText, deductionScore }
export const POST = adminRoute(async ({ body }) => {
  const parsed = parseFields(body, hintSpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const { puzzleId, hintLevel, hintText, deductionScore } = parsed.data;
  const hint = await db.hint.create({ data: { puzzleId: puzzleId!, hintLevel: hintLevel!, hintText: hintText!, deductionScore: deductionScore! } });
  return ok({ hint }, 201);
});
