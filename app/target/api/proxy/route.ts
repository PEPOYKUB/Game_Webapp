import { NextRequest, NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";

// Simulated link-preview proxy. It NEVER fetches anything: every "upstream" is a fixed entry in this map,
// and any URL that is not listed here is rejected.
const INTERNAL_HOST = "http://cache.portal.internal:8080";

type Upstream = { status: number; preview: Record<string, string>; raw?: () => Record<string, unknown> };

const upstreams: Record<string, Upstream> = {
  "https://news.kku.ac.th/digital-library": { status: 200, preview: { siteName: "KKU News", title: "KKU opens new digital library", description: "The library will open next semester with 24/7 study zones.", image: "library.jpg" } },
  "https://news.kku.ac.th/computing-fair-2026": { status: 200, preview: { siteName: "KKU News", title: "Computing Fair 2026", description: "Students can register for the fair from today.", image: "fair.jpg" } },
  "https://www.kku.ac.th/": { status: 200, preview: { siteName: "Khon Kaen University", title: "Khon Kaen University", description: "Official website of Khon Kaen University.", image: "kku.jpg" } },
  [`${INTERNAL_HOST}/`]: { status: 200, preview: { siteName: "portal-cache", title: "Index of /", description: "Internal service — not exposed to the internet." }, raw: () => ({ service: "portal-cache 0.9", routes: ["/health", "/admin/", "/admin/config"] }) },
  [`${INTERNAL_HOST}/health`]: { status: 200, preview: { siteName: "portal-cache", title: "OK", description: "Service healthy." }, raw: () => ({ status: "ok", uptime: "41d 06h" }) },
  [`${INTERNAL_HOST}/admin/`]: { status: 200, preview: { siteName: "portal-cache", title: "Admin console", description: "Restricted to internal network." }, raw: () => ({ note: "configuration is served at /admin/config" }) },
  [`${INTERNAL_HOST}/admin/config`]: { status: 200, preview: { siteName: "portal-cache", title: "Admin configuration", description: "Internal admin config." }, raw: () => ({ environment: "production", adminUser: "portal-admin", allowInternalPreview: true, flag: getFlag("ssrf") }) },
};

function upstreamKey(input: string) {
  try {
    const url = new URL(input); // parsing only — no network access
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return null;
  }
}

export function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url") || "";
  const key = upstreamKey(target);
  const upstream = key ? upstreams[key] : undefined;
  if (!upstream) return NextResponse.json({ error: "Preview unavailable: URL is not allowed", url: target }, { status: 400 });
  return NextResponse.json({ url: key, status: upstream.status, preview: upstream.preview, ...(upstream.raw && { raw: upstream.raw() }), meta: { fetchedVia: "preview-proxy/2.1", cacheHost: INTERNAL_HOST } });
}
