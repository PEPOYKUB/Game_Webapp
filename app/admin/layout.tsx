import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · CyberEscape KKU", robots: { index: false } };

const nav = [
  ["/admin", "Overview"],
  ["/admin/rooms", "Rooms & Categories"],
  ["/admin/stages", "Stages"],
  ["/admin/puzzles", "Puzzles"],
  ["/admin/hints", "Hints"],
  ["/admin/users", "Users"],
  ["/admin/attempts", "Attempts"],
  ["/admin/leaderboard", "Leaderboard"],
  ["/admin/analytics", "Analytics"],
  ["/admin/achievements", "Achievements"],
] as const;

// Players get a 404 here; guests are sent to /login. Each page repeats the check (see requireAdminPage).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <main className="admin-app">
    <header className="answer-nav"><a href="/admin" className="answer-logo"><span>⌘</span><div>CYBERESCAPE / ADMIN<small>GAME CONTROL ROOM</small></div></a><nav className="answer-links"><span>ADMIN: {admin.username.toUpperCase()}</span><a href="/">PLAYER SITE ↗</a><a href="/target" target="_blank" rel="noreferrer">TARGET SITE ↗</a></nav></header>
    <div className="admin-layout">
      <aside className="admin-nav" aria-label="Admin sections">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</aside>
      <div className="admin-main">{children}</div>
    </div>
  </main>;
}
