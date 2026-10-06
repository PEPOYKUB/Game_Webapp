// Field specs shared by the admin CRUD routes (lengths follow the domain model column sizes).
import { BUILT_IN_FLAG_KEYS, DIFFICULTIES } from "@/lib/constants";
import { positiveInt, type FieldSpec } from "@/lib/validation";

export const roomSpec = {
  roomCode: { type: "string", label: "Room code", max: 20, required: true, upper: true, pattern: /^[A-Z0-9_-]+$/ },
  roomName: { type: "string", label: "Room name", max: 100, required: true },
  description: { type: "string", label: "Description", max: 1000, nullable: true },
  difficultyLevel: { type: "enum", label: "Difficulty", values: DIFFICULTIES, required: true },
  isActive: { type: "bool", label: "Active" },
} satisfies Record<string, FieldSpec>;

export const categorySpec = {
  categoryName: { type: "string", label: "Category name", max: 50, required: true },
  categoryDescription: { type: "string", label: "Description", max: 255, nullable: true },
} satisfies Record<string, FieldSpec>;

export const stageSpec = {
  roomId: { type: "int", label: "Room", min: 1, max: 2_147_483_647, required: true },
  stageNumber: { type: "int", label: "Stage number", min: 1, max: 999, required: true },
  stageName: { type: "string", label: "Stage name", max: 100, required: true },
  storylineText: { type: "string", label: "Storyline", max: 2000, nullable: true },
  maxScore: { type: "int", label: "Max score", min: 0, max: 100_000, required: true },
} satisfies Record<string, FieldSpec>;

export const puzzleSpec = {
  stageId: { type: "int", label: "Stage", min: 1, max: 2_147_483_647, required: true },
  puzzleTitle: { type: "string", label: "Title", max: 100, required: true },
  questionText: { type: "string", label: "Question", max: 2000, required: true },
  puzzleType: { type: "string", label: "Type", max: 30, required: true, upper: true, pattern: /^[A-Z0-9_-]+$/ },
  explanationText: { type: "string", label: "Explanation", max: 1000, nullable: true },
} satisfies Record<string, FieldSpec>;

// The answer is write-only: it is hashed immediately and never returned by any API.
export const answerSpec = {
  answerSource: { type: "enum", label: "Answer source", values: ["flag", "custom"] },
  flagKey: { type: "enum", label: "Built-in flag", values: BUILT_IN_FLAG_KEYS },
  answer: { type: "string", label: "Answer", max: 200 },
} satisfies Record<string, FieldSpec>;

export const hintSpec = {
  puzzleId: { type: "int", label: "Puzzle", min: 1, max: 2_147_483_647, required: true },
  hintLevel: { type: "int", label: "Hint level", min: 1, max: 99, required: true },
  hintText: { type: "string", label: "Hint text", max: 1000, required: true },
  deductionScore: { type: "int", label: "Deduction", min: 0, max: 10_000, required: true },
} satisfies Record<string, FieldSpec>;

export const achievementSpec = {
  achievementCode: { type: "string", label: "Code", max: 30, required: true, upper: true, pattern: /^[A-Z0-9_]+$/ },
  achievementName: { type: "string", label: "Name", max: 100, required: true },
  description: { type: "string", label: "Description", max: 500, nullable: true },
  badgeIconUrl: { type: "string", label: "Badge icon URL", max: 255, nullable: true, pattern: /^(\/[^\s]*|https:\/\/[^\s]+)$/ },
  criteriaCondition: { type: "string", label: "Criteria", max: 500, nullable: true },
} satisfies Record<string, FieldSpec>;

/** Optional list of category ids for room_category; undefined = not provided, null = invalid. */
export function parseCategoryIds(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 50) return null;
  const ids = value.map(positiveInt);
  return ids.every((id): id is number => id !== null) ? [...new Set(ids)] : null;
}
