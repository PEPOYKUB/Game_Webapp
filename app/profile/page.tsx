import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserDetail } from "@/lib/admin";
import { formatDateTime, formatDuration } from "@/lib/format";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/profile");

  const user = await getUserDetail(current.userId);
  if (!user) redirect("/login?next=/profile");

  const sessions = user.sessions;
  const attempts = sessions.flatMap(session => session.attempts);
  const hints = sessions.flatMap(session => session.hintUsages);
  const progress = sessions.flatMap(session => session.progress.map(item => ({ ...item, room: session.room.roomCode, sessionId: session.sessionId })));
  const completed = sessions.filter(session => session.status === "COMPLETED");
  const totalTime = completed.reduce((sum, session) => sum + (session.endedAt ? session.endedAt.getTime() - session.startedAt.getTime() : 0), 0);
  const bestScore = completed.length ? Math.max(...completed.map(session => session.finalScore)) : 0;

  return <main className="answer-app profile-page">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><nav className="answer-links"><a href="/">GAME</a><a href="/leaderboard">LEADERBOARD</a><a href="/profile" aria-current="page">PROFILE</a>{current.role === "ADMIN" && <a href="/admin">ADMIN ↗</a>}<LogoutButton /></nav></header>

    <section className="profile-hero"><div className="profile-avatar-large">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div><div><p className="answer-kicker">PLAYER PROFILE</p><h1>{user.firstName} <i>{user.lastName}</i></h1><p className="profile-username">@{user.username}</p></div></section>

    <div className="profile-stats"><div><span>BEST SCORE</span><strong>{bestScore || "—"}</strong><small>points</small></div><div><span>SESSIONS</span><strong>{sessions.length}</strong><small>{completed.length} completed</small></div><div><span>ATTEMPTS</span><strong>{attempts.length}</strong><small>{attempts.filter(attempt => attempt.isCorrect).length} correct</small></div><div><span>HINTS USED</span><strong>{hints.length}</strong><small>−{hints.reduce((sum, hint) => sum + hint.scoreDeducted, 0)} points</small></div></div>

    <section className="profile-panel"><div className="profile-panel-head"><h2>Account information</h2></div><dl className="profile-details-grid"><dt>USERNAME</dt><dd>{user.username}</dd><dt>EMAIL</dt><dd>{user.email}</dd><dt>STUDENT ID</dt><dd>{user.studentId ?? "—"}</dd><dt>FACULTY</dt><dd>{user.faculty ? `${user.faculty.facultyCode} · ${user.faculty.facultyNameEn}` : "—"}</dd><dt>YEAR LEVEL</dt><dd>{user.yearLevel ?? "—"}</dd><dt>MEMBER SINCE</dt><dd>{formatDateTime(user.createdAt)}</dd><dt>AVERAGE TIME</dt><dd>{completed.length ? formatDuration(Math.round(totalTime / completed.length)) : "—"}</dd></dl></section>

    <div className="profile-columns"><section className="profile-panel"><div className="profile-panel-head"><h2>Game sessions</h2><span>{sessions.length} total</span></div>{sessions.length === 0 ? <p className="profile-empty">ยังไม่มี Session เริ่มเล่นเกมเพื่อบันทึกความคืบหน้า</p> : <div className="profile-list">{sessions.map(session => <div className="profile-list-row" key={session.sessionId}><div><b>{session.room.roomCode}</b><small>{session.room.roomName} · {formatDateTime(session.startedAt)}</small></div><strong>{session.finalScore} pts</strong><em>{session.status}</em></div>)}</div>}</section><section className="profile-panel"><div className="profile-panel-head"><h2>Achievements</h2><span>{user.achievements.length}</span></div>{user.achievements.length === 0 ? <p className="profile-empty">ยังไม่มี Achievement</p> : <div className="profile-list">{user.achievements.map(item => <div className="profile-list-row" key={item.achievement.achievementCode}><div><b>{item.achievement.achievementName}</b><small>{item.achievement.description ?? item.achievement.achievementCode}</small></div><em>{formatDateTime(item.unlockedAt)}</em></div>)}</div>}</section></div>

    <section className="profile-panel"><div className="profile-panel-head"><h2>Stage progress</h2><span>{progress.length} stages tracked</span></div>{progress.length === 0 ? <p className="profile-empty">ยังไม่มีความคืบหน้า เริ่มเกมเพื่อบันทึกด่าน</p> : <div className="profile-list">{progress.map(item => <div className="profile-list-row" key={`${item.sessionId}-${item.stage.stageNumber}`}><div><b>{item.room} · Stage {item.stage.stageNumber}</b><small>{item.stage.stageName} · Session #{item.sessionId}</small></div><strong>{item.scoreEarned} pts</strong><em className={item.status === "COMPLETED" ? "profile-good" : item.status === "IN_PROGRESS" ? "profile-active" : ""}>{item.status}</em></div>)}</div>}</section>

    <section className="profile-panel"><div className="profile-panel-head"><h2>Hint usage</h2><span>{hints.length} used · −{hints.reduce((sum, hint) => sum + hint.scoreDeducted, 0)} points</span></div>{hints.length === 0 ? <p className="profile-empty">ยังไม่มีการใช้ Hint</p> : <div className="profile-list">{hints.map(hint => <div className="profile-list-row" key={hint.hintUsageId}><div><b>{hint.hint.puzzle.stage.room.roomCode} · Stage {hint.hint.puzzle.stage.stageNumber}</b><small>{hint.hint.puzzle.puzzleTitle} · Hint level {hint.hint.hintLevel} · {formatDateTime(hint.usedAt)}</small></div><em className="profile-wrong">−{hint.scoreDeducted} pts</em></div>)}</div>}</section>

    <section className="profile-panel"><div className="profile-panel-head"><h2>Recent activity</h2><span>{attempts.length} attempts · {hints.length} hints</span></div>{attempts.length === 0 ? <p className="profile-empty">ยังไม่มีการตอบโจทย์</p> : <div className="profile-list">{attempts.slice(0, 20).map(attempt => <div className="profile-list-row" key={attempt.attemptId}><div><b>{attempt.puzzle.stage.room.roomCode} · S{attempt.puzzle.stage.stageNumber}</b><small>{attempt.puzzle.puzzleTitle} · {formatDateTime(attempt.attemptedAt)}</small></div><em className={attempt.isCorrect ? "profile-good" : "profile-wrong"}>{attempt.isCorrect ? "CORRECT" : "WRONG"}</em></div>)}</div>}</section>

    <footer className="answer-footer"><span>BREACH / RESPONSE</span><span>YOUR DATA · SAVED ON SERVER</span></footer>
  </main>;
}
