import { NextRequest, NextResponse } from "next/server";

const articles: Record<string, Record<string, string>> = {
  "101": { id: "101", title: "KKU opens new digital library", body: "The library will open next semester.", author: "KKU News" },
  "102": { id: "102", title: "Internal incident report", body: "Restricted: unauthorized access detected in the student portal.", author: "Security Office", flag: "FLAG{IDOR-ARTICLE-102}" },
  "103": { id: "103", title: "Computing Fair 2026", body: "Students can register from today.", author: "College of Computing" },
};

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "101";
  const article = articles[id];
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  return NextResponse.json({ data: article, requestedId: id });
}
