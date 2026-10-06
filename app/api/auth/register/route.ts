import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ROLE, USER_STATUS } from "@/lib/constants";
import { hashPassword, isSameOrigin, jsonError, setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseRegister } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  if (!rateLimit(`register:${clientIp(request.headers)}`, 5, 15 * 60 * 1000)) return jsonError("Too many sign-ups from this network — try again later", 429);

  const parsed = parseRegister(await request.json().catch(() => null));
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const { password, ...profile } = parsed.data;

  if (profile.facultyId !== null && !(await db.faculty.findUnique({ where: { facultyId: profile.facultyId }, select: { facultyId: true } }))) return jsonError("Unknown faculty", 400);

  try {
    // Self-registration always creates a player. Admins are promoted by the seed (ADMIN_EMAIL) or by another admin.
    const user = await db.appUser.create({ data: { ...profile, passwordHash: await hashPassword(password), role: ROLE.player, status: USER_STATUS.active }, select: { userId: true, username: true, role: true } });
    const response = NextResponse.json({ user: { username: user.username, role: user.role } }, { status: 201 });
    setSessionCookie(response, user.userId);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String((error.meta?.target as string[] | string | undefined) ?? "");
      const field = target.includes("email") ? "Email" : target.includes("student") ? "Student ID" : "Username";
      return jsonError(`${field} is already registered`, 409);
    }
    throw error;
  }
}
