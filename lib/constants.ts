// Enum-like values stored in VARCHAR columns (also enforced by CHECK constraints in the migration).
// Safe to import from client components.
export const ROLE = { player: "PLAYER", admin: "ADMIN" } as const;
export const USER_STATUS = { active: "ACTIVE", suspended: "SUSPENDED" } as const;
export const SESSION_STATUS = { active: "ACTIVE", completed: "COMPLETED", abandoned: "ABANDONED" } as const;
export const PROGRESS_STATUS = { locked: "LOCKED", inProgress: "IN_PROGRESS", completed: "COMPLETED" } as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

// Built-in flags produced by the Target Website (lib/flags.ts). Admins can point a puzzle at one of
// these instead of typing an answer; the flag value itself is never shown in the admin UI.
export const BUILT_IN_FLAG_KEYS = ["idor", "param", "leak", "archive", "traversal", "ssrf"] as const;
export type BuiltInFlagKey = (typeof BUILT_IN_FLAG_KEYS)[number];
