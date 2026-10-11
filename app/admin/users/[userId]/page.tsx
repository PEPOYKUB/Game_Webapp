import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { getUserDetail } from "@/lib/admin";
import { formatDateTime, formatDuration } from "@/lib/format";
import { Badge, Empty, PageHead, Panel } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: { userId: string } }) {
  await requireAdminPage();
  const userId = Number(params.userId);
  if (!Number.isInteger(userId) || userId <= 0) notFound();
  const user = await getUserDetail(userId);
  if (!user) notFound();

  const sessions = user.sessions;
  const attempts = sessions.flatMap(session => session.attempts);
  const hints = sessions.flatMap(session => session.hintUsages);
  const completed = sessions.filter(session => session.status === "COMPLETED");
  const totalTime = completed.reduce((sum, session) => sum + (session.endedAt ? session.endedAt.getTime() - session.startedAt.getTime() : 0), 0);

  return <>
    <PageHead kicker="PEOPLE / USER DETAIL" title={user.username}><a className="back-link" href="/admin/users">← BACK TO USERS</a></PageHead>
    <section className="user-profile-hero">
      <div className="user-avatar">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
      <div><p className="answer-kicker">PLAYER PROFILE · #{user.userId}</p><h2>{user.firstName} {user.lastName}</h2><p>{user.email}</p></div>
      <div className="user-profile-badges"><Badge tone={user.role === "ADMIN" ? "warn" : "neutral"}>{user.role}</Badge><Badge tone={user.status === "ACTIVE" ? "good" : "bad"}>{user.status}</Badge></div>
    </section>
    <div className="stat-grid user-stat-grid"><div className="stat"><span>SESSIONS</span><strong>{sessions.length}</strong><small>{completed.length} completed</small></div><div className="stat"><span>BEST SCORE</span><strong>{completed.length ? Math.max(...completed.map(s => s.finalScore)) : "—"}</strong><small>points</small></div><div className="stat"><span>ATTEMPTS</span><strong>{attempts.length}</strong><small>{attempts.filter(a => a.isCorrect).length} correct</small></div><div className="stat"><span>HINTS USED</span><strong>{hints.length}</strong><small>−{hints.reduce((sum, h) => sum + h.scoreDeducted, 0)} points</small></div></div>
    <Panel title="Account information"><dl className="user-detail-grid"><dt>USERNAME</dt><dd>{user.username}</dd><dt>EMAIL</dt><dd>{user.email}</dd><dt>STUDENT ID</dt><dd>{user.studentId ?? "—"}</dd><dt>FACULTY</dt><dd>{user.faculty ? `${user.faculty.facultyCode} · ${user.faculty.facultyNameEn}` : "—"}</dd><dt>YEAR LEVEL</dt><dd>{user.yearLevel ?? "—"}</dd><dt>REGISTERED</dt><dd>{formatDateTime(user.createdAt)}</dd><dt>AVERAGE TIME</dt><dd>{completed.length ? formatDuration(Math.round(totalTime / completed.length)) : "—"}</dd></dl></Panel>
    <Panel title={`Game sessions (${sessions.length})`}>{sessions.length === 0 ? <Empty>No sessions yet.</Empty> : <div className="table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>ROOM</th><th>STATUS</th><th className="num">SCORE</th><th className="num">STAGES</th><th className="num">ATTEMPTS</th><th className="num">HINTS</th><th>STARTED</th><th>TIME</th></tr></thead><tbody>{sessions.map(session => <tr key={session.sessionId}><td>{session.sessionId}</td><td><b>{session.room.roomCode}</b><small>{session.room.roomName}</small></td><td><Badge tone={session.status === "COMPLETED" ? "good" : session.status === "ACTIVE" ? "warn" : "neutral"}>{session.status}</Badge></td><td className="num">{session.finalScore}</td><td className="num">{session.progress.filter(p => p.status === "COMPLETED").length}/{session.progress.length}</td><td className="num">{session.attempts.length}</td><td className="num">{session.hintUsages.length}</td><td>{formatDateTime(session.startedAt)}</td><td>{session.endedAt ? formatDuration(session.endedAt.getTime() - session.startedAt.getTime()) : "Active"}</td></tr>)}</tbody></table></div>}</Panel>
    <div className="detail-two-col"><Panel title="Stage progress"><div className="detail-list">{sessions.flatMap(session => session.progress.map(progress => <div className="detail-row" key={`${session.sessionId}-${progress.stage.stageNumber}`}><span><b>{session.room.roomCode} · S{progress.stage.stageNumber}</b><small>{progress.stage.stageName}</small></span><Badge tone={progress.status === "COMPLETED" ? "good" : progress.status === "IN_PROGRESS" ? "warn" : "neutral"}>{progress.status}</Badge><em>{progress.scoreEarned} pts</em></div>))}</div></Panel><Panel title={`Achievements (${user.achievements.length})`}>{user.achievements.length === 0 ? <Empty>No achievements yet.</Empty> : <div className="achievement-list">{user.achievements.map(item => <div className="achievement-row" key={item.achievement.achievementCode}>{item.achievement.badgeIconUrl ? <img src={item.achievement.badgeIconUrl} alt="" width={32} height={32} /> : <span>★</span>}<div><b>{item.achievement.achievementName}</b><small>{item.achievement.description ?? item.achievement.achievementCode}</small></div><em>{formatDateTime(item.unlockedAt)}</em></div>)}</div>}</Panel></div>
    <Panel title={`Recent attempts (${attempts.length})`}>{attempts.length === 0 ? <Empty>No attempts yet.</Empty> : <div className="table-wrap"><table className="data-table"><thead><tr><th>TIME</th><th>ROOM · STAGE</th><th>PUZZLE</th><th>RESULT</th><th>SUBMITTED</th></tr></thead><tbody>{attempts.slice(0, 50).map(attempt => <tr key={attempt.attemptId}><td>{formatDateTime(attempt.attemptedAt)}</td><td>{attempt.puzzle.stage.room.roomCode} · S{attempt.puzzle.stage.stageNumber}</td><td>{attempt.puzzle.puzzleTitle}</td><td><Badge tone={attempt.isCorrect ? "good" : "bad"}>{attempt.isCorrect ? "CORRECT" : "WRONG"}</Badge></td><td className="mono clip">{attempt.submittedAnswer}</td></tr>)}</tbody></table></div>}</Panel>
    <Panel title={`Hint usage (${hints.length})`}>{hints.length === 0 ? <Empty>No hints used yet.</Empty> : <div className="detail-list">{hints.map(hint => <div className="detail-row" key={hint.hintUsageId}><span><b>{hint.hint.puzzle.stage.room.roomCode} · S{hint.hint.puzzle.stage.stageNumber} · {hint.hint.puzzle.puzzleTitle}</b><small>Hint level {hint.hint.hintLevel}</small></span><em>−{hint.scoreDeducted} pts</em><small>{formatDateTime(hint.usedAt)}</small></div>)}</div>}</Panel>
  </>;
}
