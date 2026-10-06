import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const faculties = await db.faculty.findMany({ orderBy: { facultyNameEn: "asc" }, select: { facultyId: true, facultyCode: true, facultyNameTh: true, facultyNameEn: true } });
  return NextResponse.json({ faculties });
}
