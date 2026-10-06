import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, isSameOrigin, jsonError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
