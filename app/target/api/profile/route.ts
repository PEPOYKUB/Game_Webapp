import { NextRequest, NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";

const profiles: Record<string, Record<string, string>> = {
  "student-001": { id: "student-001", name: "Narin S.", faculty: "Engineering", year: "2" },
  "admin-001": { id: "admin-001", name: "Portal Administrator", faculty: "College of Computing", year: "—", flag: getFlag("param") },
};

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "student-001";
  const role = request.nextUrl.searchParams.get("role") || "student";
  const profile = profiles[id];
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile, role, debug: "profile-service v1.4" });
}
