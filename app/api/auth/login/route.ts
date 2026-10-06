import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { USER_STATUS } from "@/lib/constants";
import { isSameOrigin, jsonError, setSessionCookie, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Compared against when the account does not exist, so response time does not reveal valid emails.
// (bcrypt of a throwaway string — not any user's password.)
const DUMMY_HASH = "$2b$12$/ALc5wDlPP2.ERZgJl15X.dTQzWjqFIeiXzkXS0DT52aZv0ujVsU6";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || !password || identifier.length > 254 || password.length > 200) return jsonError("Enter your email (or username) and password", 400);

  if (!rateLimit(`login-ip:${clientIp(request.headers)}`, 20, 15 * 60 * 1000) || !rateLimit(`login-id:${identifier}`, 8, 15 * 60 * 1000)) {
    return jsonError("Too many sign-in attempts — wait a few minutes", 429);
  }

  const user = await db.appUser.findFirst({
    where: { OR: [{ email: identifier }, { username: { equals: identifier, mode: "insensitive" } }] },
    select: { userId: true, username: true, role: true, status: true, passwordHash: true },
  });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return jsonError("Incorrect email/username or password", 401);
  if (user.status !== USER_STATUS.active) return jsonError("This account is suspended — contact the organiser", 403);

  const response = NextResponse.json({ user: { username: user.username, role: user.role } });
  setSessionCookie(response, user.userId);
  return response;
}
