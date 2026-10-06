import { db } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { adminRoute, ok } from "@/lib/admin-api";
import { ROLE, USER_STATUS } from "@/lib/constants";
import { parseFields } from "@/lib/validation";

const spec = {
  role: { type: "enum", label: "Role", values: Object.values(ROLE) },
  status: { type: "enum", label: "Status", values: Object.values(USER_STATUS) },
} as const;

// PATCH { role?, status? } — promote/demote or suspend/reactivate. Players can never reach this (ADMIN only).
export const PATCH = adminRoute(async ({ id, admin, body }) => {
  const parsed = parseFields(body, spec, { partial: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  const { role, status } = parsed.data;
  if (id === admin.userId && (role === ROLE.player || status === USER_STATUS.suspended)) return jsonError("You cannot demote or suspend your own account", 409);

  const target = await db.appUser.findUnique({ where: { userId: id! }, select: { role: true, status: true } });
  if (!target) return jsonError("Unknown user", 404);
  if (target.role === ROLE.admin && target.status === USER_STATUS.active && (role === ROLE.player || status === USER_STATUS.suspended)) {
    const otherAdmins = await db.appUser.count({ where: { role: ROLE.admin, status: USER_STATUS.active, userId: { not: id! } } });
    if (otherAdmins === 0) return jsonError("At least one active admin must remain", 409);
  }

  const user = await db.appUser.update({ where: { userId: id! }, data: { ...(role && { role }), ...(status && { status }) }, select: { userId: true, username: true, role: true, status: true } });
  return ok({ user });
}, "userId");
