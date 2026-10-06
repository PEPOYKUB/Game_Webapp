import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { categorySpec } from "@/lib/admin-specs";
import { parseFields } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ok({ categories: await db.category.findMany({ orderBy: { categoryName: "asc" } }) }));

// POST { categoryName, categoryDescription? }
export const POST = adminRoute(async ({ body }) => {
  const parsed = parseFields(body, categorySpec);
  if (parsed.error) return jsonError(parsed.error, 400);
  const category = await db.category.create({ data: { categoryName: parsed.data.categoryName!, categoryDescription: parsed.data.categoryDescription ?? null } });
  return ok({ category }, 201);
});
