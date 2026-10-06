// Small hand-rolled validators for request bodies (server-side).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[A-Za-z0-9_.-]{3,50}$/;
const STUDENT_ID = /^[A-Za-z0-9-]{1,20}$/;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export type RegisterInput = { username: string; email: string; password: string; firstName: string; lastName: string; studentId: string | null; yearLevel: number | null; facultyId: number | null };

export function parseRegister(body: unknown): { data: RegisterInput } | { error: string } {
  const fail = (error: string) => ({ error });
  const input = (body ?? {}) as Record<string, unknown>;
  const username = text(input.username);
  const email = text(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  const firstName = text(input.firstName);
  const lastName = text(input.lastName);
  const studentId = text(input.studentId) || null;
  const yearLevel = input.yearLevel === "" || input.yearLevel === null || input.yearLevel === undefined ? null : Number(input.yearLevel);
  const facultyId = input.facultyId === "" || input.facultyId === null || input.facultyId === undefined ? null : Number(input.facultyId);

  if (!USERNAME.test(username)) return fail("Username must be 3–50 characters: letters, numbers, _ . -");
  // Any email provider is allowed — not only @kku.ac.th.
  if (email.length > 254 || !EMAIL.test(email)) return fail("Please enter a valid email address");
  if (password.length < 8 || Buffer.byteLength(password) > 72) return fail("Password must be 8–72 characters");
  if (!firstName || firstName.length > 50 || !lastName || lastName.length > 50) return fail("First and last name are required (max 50 characters)");
  if (studentId && !STUDENT_ID.test(studentId)) return fail("Student ID may only contain letters, numbers and -");
  if (yearLevel !== null && (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 8)) return fail("Year level must be between 1 and 8");
  if (facultyId !== null && (!Number.isInteger(facultyId) || facultyId < 1)) return fail("Unknown faculty");
  return { data: { username, email, password, firstName, lastName, studentId, yearLevel, facultyId } };
}

export function positiveInt(value: unknown) {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === "number" && Number.isInteger(number) && number > 0 ? number : null;
}

// ---------------------------------------------------------------------------------------------
// Declarative body parser for the admin CRUD APIs
// ---------------------------------------------------------------------------------------------

type Base = { label: string; required?: boolean };
export type FieldSpec =
  | (Base & { type: "string"; max: number; min?: number; pattern?: RegExp; nullable?: boolean; upper?: boolean })
  | (Base & { type: "int"; min: number; max: number; nullable?: boolean })
  | (Base & { type: "bool" })
  | (Base & { type: "enum"; values: readonly string[] });

type Out<F extends FieldSpec> = F extends { type: "int" } ? (F extends { nullable: true } ? number | null : number)
  : F extends { type: "bool" } ? boolean
  : F extends { type: "string" } ? (F extends { nullable: true } ? string | null : string)
  : string;
export type Parsed<S extends Record<string, FieldSpec>> = { [K in keyof S]?: Out<S[K]> };

/**
 * Validates `body` against `spec`. Unknown keys are ignored. With `partial` (PATCH) missing fields are
 * skipped; otherwise `required` fields must be present. Empty strings become null for nullable fields.
 */
export function parseFields<S extends Record<string, FieldSpec>>(body: unknown, spec: S, { partial = false } = {}): { data: Parsed<S>; error?: string } {
  const fail = (error: string) => ({ data: {} as Parsed<S>, error });
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request body");
  const input = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(spec)) {
    const raw = input[key];
    if (raw === undefined) {
      if (!partial && field.required) return fail(`${field.label} is required`);
      continue;
    }
    if (raw === null || (typeof raw === "string" && raw.trim() === "")) {
      if ("nullable" in field && field.nullable) { data[key] = null; continue; }
      if (field.required) return fail(`${field.label} is required`);
      continue;
    }
    switch (field.type) {
      case "string": {
        if (typeof raw !== "string") return fail(`${field.label} must be text`);
        let value = raw.trim();
        if (field.upper) value = value.toUpperCase();
        if (value.length < (field.min ?? (field.required ? 1 : 0))) return fail(`${field.label} is required`);
        if (value.length > field.max) return fail(`${field.label} must be at most ${field.max} characters`);
        if (field.pattern && !field.pattern.test(value)) return fail(`${field.label} has an invalid format`);
        data[key] = value;
        break;
      }
      case "int": {
        const value = typeof raw === "string" && /^-?\d+$/.test(raw.trim()) ? Number(raw) : raw;
        if (typeof value !== "number" || !Number.isInteger(value) || value < field.min || value > field.max) return fail(`${field.label} must be a whole number from ${field.min} to ${field.max}`);
        data[key] = value;
        break;
      }
      case "bool": {
        const value = raw === "true" ? true : raw === "false" ? false : raw;
        if (typeof value !== "boolean") return fail(`${field.label} must be true or false`);
        data[key] = value;
        break;
      }
      case "enum": {
        if (typeof raw !== "string" || !field.values.includes(raw)) return fail(`${field.label} must be one of: ${field.values.join(", ")}`);
        data[key] = raw;
        break;
      }
    }
  }
  if (partial && Object.keys(data).length === 0) return fail("Nothing to update");
  return { data: data as Parsed<S> };
}
