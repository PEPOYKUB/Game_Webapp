// Shared plumbing for /api/admin/* route handlers: admin guard + friendly database error mapping.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, type CurrentUser } from "@/lib/auth";
import { answerSpec } from "@/lib/admin-specs";
import { buildAnswerHash, type FlagKey } from "@/lib/flags";
import { parseFields, positiveInt } from "@/lib/validation";

type Context = { params: Record<string, string> };
type Handler = (args: { request: NextRequest; admin: CurrentUser; id: number | null; body: unknown }) => Promise<NextResponse>;

/**
 * Wraps an admin handler: checks the ADMIN role on the server (and same-origin for writes), parses the
 * `[id]` route param and JSON body, and turns constraint violations into 4xx responses instead of 500s.
 */
export function adminRoute(handler: Handler, idParam?: string) {
  return async (request: NextRequest, context: Context) => {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const id = idParam ? positiveInt(context.params[idParam]) : null;
    if (idParam && !id) return jsonError("Not found", 404);
    // An empty body is fine (e.g. POST /resync, DELETE); a non-empty body must be valid JSON.
    const raw = await request.text().catch(() => "");
    let body: unknown = null;
    if (raw.trim()) {
      try {
        body = JSON.parse(raw);
      } catch {
        return jsonError("Invalid JSON body", 400);
      }
    }
    try {
      return await handler({ request, admin: auth.user, id, body });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") return jsonError(`Already exists: ${String(error.meta?.target ?? "unique value")}`, 409);
        if (error.code === "P2003") return jsonError("Still referenced by other records (sessions, attempts or usages) — it cannot be removed", 409);
        if (error.code === "P2025") return jsonError("Not found", 404);
      }
      throw error;
    }
  };
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

/**
 * Turns { answerSource: "flag", flagKey } or { answerSource: "custom", answer } into a correct_answer_hash.
 * Returns undefined when no answer was supplied (PATCH keeps the current hash).
 */
export function resolveAnswerHash(body: unknown, { required }: { required: boolean }): { hash?: string; error?: string } {
  const parsed = parseFields(body, answerSpec);
  if (parsed.error) return { error: parsed.error };
  const { answerSource: source, flagKey, answer } = parsed.data;
  if (!source) return required ? { error: "Choose an answer source" } : {};
  if (source === "flag") return flagKey ? { hash: buildAnswerHash({ flagKey: flagKey as FlagKey }) } : { error: "Choose a built-in flag" };
  if (!answer || answer.length < 3) return required ? { error: "Answer must be at least 3 characters" } : { error: "Type the new answer (or leave the source empty to keep the current one)" };
  return { hash: buildAnswerHash({ answer }) };
}
