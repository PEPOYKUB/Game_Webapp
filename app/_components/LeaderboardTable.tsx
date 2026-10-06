import { formatDateTime, formatDuration } from "@/lib/format";
import type { getLeaderboard } from "@/lib/stats";

type Row = Awaited<ReturnType<typeof getLeaderboard>>[number];

export function LeaderboardTable({ rows, admin = false }: { rows: Row[]; admin?: boolean }) {
  if (rows.length === 0) return <p className="empty-line">No completed runs match these filters yet.</p>;
  return <div className="table-wrap"><table className="data-table">
    <thead><tr><th>#</th><th>PLAYER</th><th>FACULTY</th><th>YEAR</th><th>ROOM</th><th className="num">SCORE</th><th className="num">TIME</th><th className="num">HINTS</th>{admin && <><th className="num">ATTEMPTS</th><th>FINISHED</th></>}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.sessionId} className={row.rank <= 3 ? `podium-${row.rank}` : ""}>
      <td>{row.rank}</td><td><b>{row.username}</b></td><td>{row.faculty ?? "—"}</td><td>{row.yearLevel ?? "—"}</td><td>{row.room}</td>
      <td className="num"><b>{row.score}</b></td><td className="num">{formatDuration(row.durationMs === Number.MAX_SAFE_INTEGER ? null : row.durationMs)}</td><td className="num">{row.hints}</td>
      {admin && <><td className="num">{row.attempts}</td><td>{formatDateTime(row.endedAt)}</td></>}
    </tr>)}</tbody>
  </table></div>;
}
