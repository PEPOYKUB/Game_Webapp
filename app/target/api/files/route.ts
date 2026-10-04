import { posix } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";

// Simulated file system — nothing here touches the real disk.
const DOCS_ROOT = "/srv/portal/docs";

const virtualFiles: Record<string, { updated: string; content: () => string }> = {
  "/srv/portal/docs/student-guide.txt": { updated: "2026-06-01", content: () => "KKU STUDENT GUIDE 2026\n\n1. Activate your KKU account before the first week of class.\n2. Register courses through the Student Portal.\n3. Contact the IT Service Desk for password resets." },
  "/srv/portal/docs/academic-calendar.txt": { updated: "2026-05-20", content: () => "ACADEMIC CALENDAR 2026\n\nSemester 1 begins ....... 10 AUG 2026\nMidterm examinations .... 28 SEP – 04 OCT 2026\nFinal examinations ...... 30 NOV – 11 DEC 2026" },
  "/srv/portal/docs/library-rules.txt": { updated: "2026-04-11", content: () => "LIBRARY RULES\n\n- Keep your student card with you at all times.\n- Borrowed books must be returned within 14 days.\n- Quiet zones are on floors 3 and 4." },
  "/srv/portal/secret.txt": { updated: "2026-01-09", content: () => `PORTAL MAINTENANCE NOTES — DO NOT PUBLISH\n\nbackup window: Sunday 02:00\nrecovery token: ${getFlag("traversal")}` },
  "/etc/passwd": { updated: "2025-12-01", content: () => "root:x:0:0:root:/root:/bin/sh\nportal:x:1001:1001:portal service:/srv/portal:/bin/sh" },
};

export function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") || "student-guide.txt";
  // Vulnerable on purpose: the user-supplied name is joined to the docs folder without checking it stays inside.
  const path = posix.join(DOCS_ROOT, name);
  const file = virtualFiles[path];
  if (!file) return NextResponse.json({ error: "File not found", path }, { status: 404 });
  const content = file.content();
  return NextResponse.json({ file: { name: posix.basename(path), path, size: `${content.length} B`, updated: file.updated, content } });
}
