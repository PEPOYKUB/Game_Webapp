import { requireAdminPage } from "@/lib/auth";
import { listAttempts } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import { getFilterOptions } from "@/lib/stats";
import { Badge, Empty, PageHead, Pager, Panel } from "../_components/ui";

export default async function AdminAttempts({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const [result, options] = await Promise.all([listAttempts(searchParams), getFilterOptions()]);

  return <>
    <PageHead kicker="ACTIVITY / PUZZLE_ATTEMPT" title="Attempts">Every flag submission is logged. Correct answers — and wrong answers that are a real flag for another challenge — are stored redacted, so this table never contains a working flag.</PageHead>
    <form className="filter-bar" method="get">
      <label>PLAYER<input name="q" defaultValue={searchParams.q ?? ""} placeholder="username" maxLength={50} /></label>
      <label>RESULT<select name="result" defaultValue={searchParams.result ?? ""}><option value="">All</option><option value="correct">Correct</option><option value="wrong">Wrong</option></select></label>
      <label>ROOM<select name="roomId" defaultValue={searchParams.roomId ?? ""}><option value="">All rooms</option>{options.rooms.map(r => <option key={r.roomId} value={r.roomId}>{r.roomCode}</option>)}</select></label>
      <button>FILTER</button><a href="/admin/attempts">RESET</a>
    </form>

    <Panel title={`Attempts (${result.total})`}>
      {result.attempts.length === 0 ? <Empty>No attempts match.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>TIME</th><th>PLAYER</th><th className="num">SESSION</th><th>ROOM · STAGE</th><th>PUZZLE</th><th>RESULT</th><th>SUBMITTED</th></tr></thead>
        <tbody>{result.attempts.map(a => <tr key={a.attemptId}>
          <td>{formatDateTime(a.attemptedAt)}</td><td><b>{a.session.user.username}</b></td><td className="num">{a.session.sessionId}</td>
          <td>{a.puzzle.stage.room.roomCode} · S{a.puzzle.stage.stageNumber}</td><td>{a.puzzle.puzzleTitle}</td>
          <td><Badge tone={a.isCorrect ? "good" : "bad"}>{a.isCorrect ? "CORRECT" : "WRONG"}</Badge></td>
          <td className="mono clip">{a.submittedAnswer}</td>
        </tr>)}</tbody>
      </table></div>}
      <Pager page={result.page} pages={result.pages} total={result.total} params={searchParams} path="/admin/attempts" />
    </Panel>
  </>;
}
