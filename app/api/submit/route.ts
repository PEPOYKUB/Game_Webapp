import { NextRequest, NextResponse } from "next/server";
import { challenges } from "@/lib/challenges";
import { checkFlag } from "@/lib/flags";

// Accepts the challenge id ("web-01") or its number (1–5, as a number or string).
function findChallenge(challengeId: unknown) {
  if (typeof challengeId === "number" || (typeof challengeId === "string" && /^\d+$/.test(challengeId))) return challenges[Number(challengeId) - 1];
  return challenges.find(item => item.id === challengeId);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const challengeId = body?.challengeId;
  const flag = body?.flag;
  if ((typeof challengeId !== "string" && typeof challengeId !== "number") || typeof flag !== "string" || flag.length > 200) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const challenge = findChallenge(challengeId);
  if (!challenge) return NextResponse.json({ error: "Unknown challenge" }, { status: 404 });
  return NextResponse.json({ correct: checkFlag(challenge.flagKey, flag) });
}
