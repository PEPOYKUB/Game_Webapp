import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getFilterOptions, getLeaderboard, parseFilters } from "@/lib/stats";
import { LeaderboardTable } from "@/app/_components/LeaderboardTable";
import { StatsFilters } from "@/app/_components/StatsFilters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leaderboard · CyberEscape KKU" };

// Public leaderboard: best completed run per player, ranked by score then time. Shows usernames only.
export default async function LeaderboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseFilters(searchParams);
  const [rows, options, user] = await Promise.all([getLeaderboard(filters, 50), getFilterOptions(), getCurrentUser()]);
  return <main className="answer-app">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><nav className="answer-links"><a href="/">← BACK TO GAME</a>{!user && <a href="/login">LOGIN</a>}</nav></header>
    <section className="answer-intro compact"><p className="answer-kicker">HALL OF FAME / BEST COMPLETED RUNS</p><h1>Leader<i>board.</i></h1><p>อันดับคิดจากคะแนนสูงสุด แล้วจึงดูเวลาที่ใช้น้อยที่สุด · หนึ่งแถวต่อผู้เล่นต่อห้อง</p></section>
    <StatsFilters options={options} filters={filters} action="/leaderboard" />
    <LeaderboardTable rows={rows} />
    <footer className="answer-footer"><span>BREACH / RESPONSE</span><span>CONTROLLED EDUCATIONAL SIMULATION — NO REAL TARGETS</span></footer>
  </main>;
}
