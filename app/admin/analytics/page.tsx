import { requireAdminPage } from "@/lib/auth";
import { formatDuration, formatPercent } from "@/lib/format";
import { getAdminOverview, getAnalytics, getFacultyBreakdown, getFilterOptions, parseFilters } from "@/lib/stats";
import { StatsFilters } from "@/app/_components/StatsFilters";
import { Empty, PageHead, Panel, Stat } from "../_components/ui";

function Bar({ ratio }: { ratio: number | null }) {
  return <span className="bar" aria-hidden="true"><i style={{ width: `${Math.round((ratio ?? 0) * 100)}%` }} /></span>;
}

export default async function AdminAnalytics({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const filters = parseFilters(searchParams);
  const [overview, analytics, faculties, options] = await Promise.all([getAdminOverview(filters), getAnalytics(filters), getFacultyBreakdown(), getFilterOptions()]);
  const maxWrong = Math.max(1, ...analytics.mostFailedStages.map(s => s.wrong));
  const maxHint = Math.max(1, ...analytics.topHints.map(h => h.uses));

  return <>
    <PageHead kicker="RESULTS / ANALYTICS" title="Analytics">Filters apply to sessions (room) and to the players who played them (faculty, year level).</PageHead>
    <StatsFilters options={options} filters={filters} action="/admin/analytics" />

    <div className="stat-grid">
      <Stat label="SESSIONS" value={overview.sessions.total} note={`${overview.sessions.completed} completed`} />
      <Stat label="COMPLETION RATE" value={formatPercent(overview.completionRate)} note={`${overview.playersFinished}/${overview.playersStarted} players`} />
      <Stat label="AVERAGE SCORE" value={overview.averageScore === null ? "—" : Math.round(overview.averageScore)} note={`highest ${overview.highestScore ?? "—"}`} />
      <Stat label="AVERAGE TIME" value={formatDuration(overview.averageDurationMs)} note={`fastest ${formatDuration(overview.fastestDurationMs)}`} />
      <Stat label="ANSWER ACCURACY" value={formatPercent(overview.attempts.accuracy)} note={`${overview.attempts.wrong} wrong of ${overview.attempts.total}`} />
      <Stat label="HINTS USED" value={overview.hints.used} note={`−${overview.hints.pointsDeducted} pts`} />
    </div>

    <Panel title="Pass rate per stage">
      {analytics.stages.length === 0 ? <Empty>No stages.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ROOM</th><th className="num">#</th><th>STAGE</th><th className="num">REACHED</th><th className="num">CLEARED</th><th>PASS RATE</th><th className="num">ATTEMPTS</th><th className="num">WRONG</th><th className="num">HINTS</th><th className="num">AVG CLEAR TIME</th></tr></thead>
        <tbody>{analytics.stages.map(s => <tr key={s.stageId}><td>{s.room}</td><td className="num">{s.number}</td><td>{s.name}</td><td className="num">{s.reached}</td><td className="num">{s.cleared}</td><td><Bar ratio={s.passRate} /> {formatPercent(s.passRate)}</td><td className="num">{s.attempts}</td><td className="num">{s.wrong}</td><td className="num">{s.hintsUsed}</td><td className="num">{formatDuration(s.averageClearMs)}</td></tr>)}</tbody>
      </table></div>}
    </Panel>

    <div className="panel-grid">
      <Panel title="Most failed stages">
        {analytics.mostFailedStages.length === 0 ? <Empty>No wrong answers yet.</Empty> : <ol className="rank-list">{analytics.mostFailedStages.map(s => <li key={s.stageId}><span>{s.room} · S{s.number}</span><b>{s.name}</b><Bar ratio={s.wrong / maxWrong} /><em>{s.wrong} wrong · {formatPercent(s.wrongRate)}</em></li>)}</ol>}
      </Panel>
      <Panel title="Slowest puzzles (avg time to solve)">
        {analytics.slowestPuzzles.length === 0 ? <Empty>No solves yet.</Empty> : <ol className="rank-list">{analytics.slowestPuzzles.map(p => <li key={p.puzzleId}><span>{p.room} · S{p.stageNumber}</span><b>{p.title}</b><em>avg {formatDuration(p.averageSolveMs)} · max {formatDuration(p.slowestSolveMs)} · {p.solves} solves</em></li>)}</ol>}
      </Panel>
      <Panel title="Most used hints">
        {analytics.topHints.length === 0 ? <Empty>No hints used yet.</Empty> : <ol className="rank-list">{analytics.topHints.map(h => <li key={h.hintId}><span>{h.room} · S{h.stageNumber} · L{h.level}</span><b>{h.puzzle}</b><Bar ratio={h.uses / maxHint} /><em>{h.uses} uses · −{h.deduction} each</em></li>)}</ol>}
      </Panel>
      <Panel title="Players by faculty">
        {faculties.faculties.length === 0 ? <Empty>No faculty data yet.</Empty> : <ol className="rank-list">{faculties.faculties.map(f => <li key={f.code}><span>{f.code}</span><b>{f.name}</b><Bar ratio={f.users ? f.finishers / f.users : 0} /><em>{f.finishers}/{f.users} finished</em></li>)}</ol>}
        <p className="muted-note">{faculties.unassigned} user(s) without a faculty.</p>
      </Panel>
    </div>
  </>;
}
