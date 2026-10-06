// Server-only: never import this file from a Client Component.
// Flags are derived from FLAG_SECRET so the real values never live in the public source.
import { createHmac, timingSafeEqual } from "crypto";
import { BUILT_IN_FLAG_KEYS, type BuiltInFlagKey } from "@/lib/constants";

const DEV_SECRET = "cyberescape-local-dev-secret";

const flagPrefixes: Record<BuiltInFlagKey, string> = {
  idor: "IDOR-ARTICLE-102",
  param: "PARAM-ROLE-ADMIN-001",
  leak: "API-RESPONSE-LEAK",
  archive: "HIDDEN-ENDPOINT-ARCHIVE",
  traversal: "PATH-TRAVERSAL-SECRET",
  ssrf: "SSRF-ADMIN-CONFIG",
};

export type FlagKey = BuiltInFlagKey;

function secret() {
  const value = process.env.FLAG_SECRET;
  if (value) return value;
  // `next build` imports route modules with NODE_ENV=production; only refuse at real runtime.
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("FLAG_SECRET is required in production");
  }
  return DEV_SECRET;
}

export function getFlag(key: FlagKey) {
  const hash = createHmac("sha256", secret()).update(key).digest("hex").slice(0, 8).toUpperCase();
  return `FLAG{${flagPrefixes[key]}-${hash}}`;
}

const normalize = (answer: string) => answer.trim().toUpperCase();

// Keyed with FLAG_SECRET, so a leaked database cannot be brute-forced offline.
const hmacAnswer = (answer: string) => createHmac("sha256", secret()).update(`answer:${normalize(answer)}`).digest("hex");

/**
 * Value stored in puzzle.correct_answer_hash: "<source>$<hmac>".
 * source is "flag:<key>" for a built-in Target Website flag (so the hash can be refreshed when FLAG_SECRET
 * changes) or "custom" for an answer typed by an admin. Neither form contains the answer itself.
 */
export function buildAnswerHash(input: { flagKey: FlagKey } | { answer: string }) {
  return "flagKey" in input ? `flag:${input.flagKey}$${hmacAnswer(getFlag(input.flagKey))}` : `custom$${hmacAnswer(input.answer)}`;
}

/** "flag:idor" / "custom" — safe to show admins. */
export function answerSource(stored: string) {
  const index = stored.lastIndexOf("$");
  return index > 0 ? stored.slice(0, index) : "custom";
}

/** Recomputes a built-in flag hash with the current FLAG_SECRET; returns null for custom answers. */
export function refreshAnswerHash(stored: string) {
  const source = answerSource(stored);
  const key = source.startsWith("flag:") ? source.slice(5) : null;
  return key && (BUILT_IN_FLAG_KEYS as readonly string[]).includes(key) ? buildAnswerHash({ flagKey: key as FlagKey }) : null;
}

export function checkAnswer(stored: string, submitted: string) {
  const expected = Buffer.from(stored.slice(stored.lastIndexOf("$") + 1), "hex");
  const actual = Buffer.from(hmacAnswer(submitted), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** True when the text is any real flag (including ones for other puzzles) — such input is never stored. */
export function isKnownFlag(answer: string) {
  const value = normalize(answer);
  return BUILT_IN_FLAG_KEYS.some(key => getFlag(key) === value);
}
