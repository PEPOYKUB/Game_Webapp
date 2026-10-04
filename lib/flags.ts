// Server-only: never import this file from a Client Component.
// Flags are derived from FLAG_SECRET so the real values never live in the public source.
import { createHmac, timingSafeEqual } from "crypto";

const DEV_SECRET = "cyberescape-local-dev-secret";

const flagPrefixes = {
  idor: "IDOR-ARTICLE-102",
  param: "PARAM-ROLE-ADMIN-001",
  leak: "API-RESPONSE-LEAK",
  archive: "HIDDEN-ENDPOINT-ARCHIVE",
  traversal: "PATH-TRAVERSAL-SECRET",
  ssrf: "SSRF-ADMIN-CONFIG",
} as const;

export type FlagKey = keyof typeof flagPrefixes;

function secret() {
  const value = process.env.FLAG_SECRET;
  if (!value && process.env.NODE_ENV === "production") console.warn("[flags] FLAG_SECRET is not set — using the public dev secret");
  return value || DEV_SECRET;
}

export function getFlag(key: FlagKey) {
  const hash = createHmac("sha256", secret()).update(key).digest("hex").slice(0, 8).toUpperCase();
  return `FLAG{${flagPrefixes[key]}-${hash}}`;
}

export function checkFlag(key: FlagKey, submitted: string) {
  const expected = Buffer.from(getFlag(key));
  const actual = Buffer.from(submitted.trim().toUpperCase());
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
