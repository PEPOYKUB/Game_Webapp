// Server-only authentication: bcrypt passwords + an HMAC-signed session cookie.
// The cookie only carries the user id; role and status are re-read from the database on every request,
// so promoting, demoting or suspending a user takes effect immediately.
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ROLE, USER_STATUS, type Role } from "@/lib/constants";

export const SESSION_COOKIE = "ce_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEV_AUTH_SECRET = "cyberescape-local-dev-auth-secret";

export type { Role };
export type CurrentUser = { userId: number; username: string; email: string; firstName: string; lastName: string; role: Role; status: string };

function authSecret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("NEXTAUTH_SECRET is required in production");
  }
  return DEV_AUTH_SECRET;
}

const sign = (payload: string) => createHmac("sha256", authSecret()).update(payload).digest("base64url");

export function createSessionToken(userId: number) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`;
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token: string | undefined) {
  if (!token) return null;
  const [id, expires, signature] = token.split(".");
  if (!id || !expires || !signature) return null;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  const userId = Number(id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export function setSessionCookie(response: NextResponse, userId: number) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SECONDS });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

const publicUserFields = { userId: true, username: true, email: true, firstName: true, lastName: true, role: true, status: true } as const;

/** The signed-in, active user — or null. Works in Server Components and Route Handlers. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = readSessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await db.appUser.findUnique({ where: { userId }, select: publicUserFields });
  if (!user || user.status !== USER_STATUS.active) return null;
  return { ...user, role: user.role === ROLE.admin ? ROLE.admin : ROLE.player };
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Rejects cross-site state-changing requests (CSRF) when the browser reports a foreign Origin. */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; the SameSite=Lax cookie still covers browsers
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guarded = { user: CurrentUser; error?: never } | { user?: never; error: NextResponse };

export async function requireUser(request?: NextRequest): Promise<Guarded> {
  if (request && request.method !== "GET" && !isSameOrigin(request)) return { error: jsonError("Cross-site request blocked", 403) };
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Please sign in", 401) };
  return { user };
}

/** Every /api/admin route must call this — the role check happens on the server, never in the client. */
export async function requireAdmin(request?: NextRequest): Promise<Guarded> {
  const result = await requireUser(request);
  if (result.error) return result;
  if (result.user.role !== ROLE.admin) return { error: jsonError("Admin only", 403) };
  return result;
}

/**
 * For admin Server Components. Every /admin page calls this itself (not only the layout), because a
 * client-side navigation can request a page's RSC payload without re-running the shared layout.
 */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== ROLE.admin) notFound();
  return user;
}
