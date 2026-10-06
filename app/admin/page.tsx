import { requireAdminPage } from "@/lib/auth";
import { listAttempts, listSessions } from "@/lib/admin";
import { SESSION_STATUS } from "@/lib/constants";
import { formatDateTime, formatDuration, formatPercent } from "@/lib/format";
import { getAdminOverview, getLeaderboard } from "@/lib/stats";
import { LeaderboardTable } from "@/app/_components/LeaderboardTable";
import { Badge, Empty, PageHead, Panel, Stat } from "./_components/ui";

const tone = (status: string) => (status === SESSION_STATUS.completed ? "good" : status === SESSION_STATUS.active ? "warn" : "neutral");

export default async function AdminOverview() {
  await requireAdminPage();
  const [overview, top, sessions, attempts] = await Promise.all([getAdminOverview(), getLeaderboard({}, 5), listSessions({}), listAttempts({})]);
  return <>
    <PageHead kicker="CONTROL ROOM / OVERVIEW" title="Overview" />
    <div className="stat-grid">
      <Stat label="PLAYERS" value={overview.users.players} note={`${overview.users.admins} admin · ${overview.users.suspended} suspended · +${overview.users.newThisWeek} this week`} />
      <Stat label="GAME SESSIONS" value={overview.sessions.total} note={`${overview.sessions.active} active · ${overview.sessions.completed} completed · ${overview.sessions.abandoned} abandoned`} />
      <Stat label="COMPLETION RATE" value={formatPercent(overview.completionRate)} note={`${overview.playersFinished} / ${overview.playersStarted} players finished a room`} />
      <Stat label="AVERAGE SCORE" value={overview.averageScore === null ? "—" : Math.round(overview.averageScore)} note={`highest ${overview.highestScore ?? "—"}`} />
      <Stat label="AVERAGE TIME" value={formatDuration(overview.averageDurationMs)} note={`fastest ${formatDuration(overview.fastestDurationMs)}`} />
      <Stat label="ATTEMPTS" value={overview.attempts.total} note={`${formatPercent(overview.attempts.accuracy)} correct · ${overview.attempts.wrong} wrong`} />
      <Stat label="HINTS USED" value={overview.hints.used} note={`${overview.hints.pointsDeducted} points deducted`} />
    </div>

    <Panel title="Top 5 players" aside={<a href="/admin/leaderboard">FULL LEADERBOARD →</a>}><LeaderboardTable rows={top} /></Panel>

    <Panel title="Latest sessions">
      {sessions.sessions.length === 0 ? <Empty>No game sessions yet.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ID</th><th>PLAYER</th><th>ROOM</th><th>STATUS</th><th className="num">STAGES</th><th className="num">SCORE</th><th className="num">ATTEMPTS</th><th className="num">HINTS</th><th>STARTED</th><th className="num">DURATION</th></tr></thead>
        <tbody>{sessions.sessions.slice(0, 10).map(s => <tr key={s.sessionId}><td>{s.sessionId}</td><td>{s.username}</td><td>{s.room}</td><td><Badge tone={tone(s.status)}>{s.status}</Badge></td><td className="num">{s.stagesCleared}/{s.stagesTotal}</td><td className="num">{s.finalScore}</td><td className="num">{s.attempts}</td><td className="num">{s.hints}</td><td>{formatDateTime(s.startedAt)}</td><td className="num">{formatDuration(s.endedAt ? new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime() : null)}</td></tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="Latest attempts" aside={<a href="/admin/attempts">ALL ATTEMPTS →</a>}>
      {attempts.attempts.length === 0 ? <Empty>No attempts yet.</Empty> : <ul className="feed">{attempts.attempts.slice(0, 8).map(a => <li key={a.attemptId}><Badge tone={a.isCorrect ? "good" : "bad"}>{a.isCorrect ? "CORRECT" : "WRONG"}</Badge><b>{a.session.user.username}</b><span>{a.puzzle.stage.room.roomCode} · S{a.puzzle.stage.stageNumber} · {a.puzzle.puzzleTitle}</span><em>{formatDateTime(a.attemptedAt)}</em></li>)}</ul>}
    </Panel>
  </>;
}
