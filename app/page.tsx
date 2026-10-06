"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameView } from "@/lib/game";
import { formatDuration } from "@/lib/format";
import { SESSION_STATUS, PROGRESS_STATUS, ROLE } from "@/lib/constants";

// Everything shown here comes from the server (/api/game/*): progress, score, hints and achievements live
// in PostgreSQL, so a refresh resumes the game and nothing in DevTools can change the score.
type State = GameView & { user: { username: string; firstName: string; role: string } };
type Status = "idle" | "checking" | "correct" | "wrong" | "error";
type Load = { kind: "loading" } | { kind: "guest" } | { kind: "error"; message: string } | { kind: "ready"; game: State };

async function api<T>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export default function AnswerWeb() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [roomId, setRoomId] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (room: number | null = roomId, focusOpen = false) => {
    const result = await api<State>(`/api/game/state${room ? `?roomId=${room}` : ""}`);
    if (result.status === 401) return setLoad({ kind: "guest" });
    if (!result.ok) return setLoad({ kind: "error", message: result.data.error ?? "Could not load the game" });
    const game = result.data;
    setLoad({ kind: "ready", game });
    if (game.room) setRoomId(game.room.roomId);
    if (focusOpen) {
      const open = game.stages.findIndex(s => s.status === PROGRESS_STATUS.inProgress);
      setActive(open >= 0 ? open : 0);
    }
    return game;
  }, [roomId]);

  useEffect(() => { refresh(null, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const game = load.kind === "ready" ? load.game : null;
  const session = game?.session ?? null;
  const running = session?.status === SESSION_STATUS.active;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (load.kind === "loading") return <Shell><p className="loading-line">Loading mission control…</p></Shell>;
  if (load.kind === "guest") return <Shell><GuestIntro /></Shell>;
  if (load.kind === "error" || !game) return <Shell><p className="answer-status wrong">× {load.kind === "error" ? load.message : "Could not load the game"}</p></Shell>;

  const user = game.user;
  const stages = game.stages;
  const stage = stages[Math.min(active, Math.max(0, stages.length - 1))];
  const puzzle = stage?.puzzles[0];
  const finished = session?.status === SESSION_STATUS.completed;
  const elapsed = session ? (session.endedAt ? new Date(session.endedAt).getTime() : now) - new Date(session.startedAt).getTime() : 0;

  async function start(restart: boolean) {
    if (restart && !confirm("Start over? Your current run will be marked as abandoned and a new session begins.")) return;
    setBusy(true);
    const result = await api<{ roomId: number }>("/api/game/start", { roomId, restart });
    setBusy(false);
    if (!result.ok) return setMessage(result.data.error ?? "Could not start the game");
    setShowRules(false); setValue(""); setStatus("idle"); setMessage("");
    await refresh(result.data.roomId, true);
  }

  function choose(index: number) {
    if (stages[index]?.status === PROGRESS_STATUS.locked) return;
    setActive(index); setValue(""); setStatus("idle"); setMessage("");
  }

  async function submit() {
    if (!puzzle || puzzle.solved || !value.trim() || status === "checking") return;
    setStatus("checking"); setMessage("");
    const result = await api<{ correct: boolean; sessionCompleted?: boolean; newAchievements?: string[] }>("/api/game/submit", { puzzleId: puzzle.puzzleId, flag: value });
    if (!result.ok) { setStatus("error"); setMessage(result.data.error ?? "Could not reach the flag checker"); return; }
    setStatus(result.data.correct ? "correct" : "wrong");
    if (result.data.newAchievements?.length) setToast(result.data.newAchievements);
    if (result.data.correct) { setValue(""); await refresh(); }
  }

  async function openHint(level: number, deduction: number) {
    if (!puzzle || busy) return;
    if (!confirm(`Use hint ${level}? ${deduction} points will be deducted from this run.`)) return;
    setBusy(true);
    const result = await api("/api/game/hint", { puzzleId: puzzle.puzzleId, level });
    setBusy(false);
    if (!result.ok) return setMessage(result.data.error ?? "Could not open the hint");
    await refresh();
  }

  async function switchRoom(next: number) {
    setRoomId(next); setValue(""); setStatus("idle"); setMessage("");
    await refresh(next, true);
  }

  return <Shell user={user} onRules={() => setShowRules(true)} onReset={running ? () => start(true) : undefined}>
    <section className="answer-intro"><p className="answer-kicker">MISSION CONTROL / {game.room ? `${game.room.code} · ${game.room.difficulty}` : "NO ROOM"}</p><h1>Find it.<br /><i>Prove it.</i></h1><p>คำตอบที่ถูกต้องไม่ได้อยู่ในหน้านี้<br />เปิด Target Website แล้วค้นหาหลักฐานจาก API</p><a className="target-button" href="/target" target="_blank" rel="noreferrer">GO TO TARGET WEBSITE <span>↗</span></a></section>

    {game.rooms.length > 1 && <div className="room-picker"><span className="answer-kicker">ROOM</span>{game.rooms.map(r => <button key={r.roomId} className={r.roomId === game.room?.roomId ? "active" : ""} onClick={() => switchRoom(r.roomId)}>{r.name}<small>{r.code} · {r.difficulty}</small></button>)}</div>}

    {!game.room ? <p className="empty-line">No room is open right now — please check back later.</p>
      : !session ? <StartPanel room={game.room} stages={stages.length} busy={busy} onStart={() => start(false)} error={message} />
      : finished ? <Summary game={game} elapsed={elapsed} busy={busy} onAgain={() => start(false)} />
      : <div className="answer-grid">
        <aside className="challenge-nav"><div className="answer-section-label">CHALLENGES <b>{String(stages.length).padStart(2, "0")}</b></div>{stages.map((item, index) => {
          const locked = item.status === PROGRESS_STATUS.locked; const done = item.status === PROGRESS_STATUS.completed;
          return <button key={item.stageId} className={[active === index ? "active" : "", locked ? "locked" : "", done ? "done" : ""].join(" ").trim()} disabled={locked} aria-current={active === index} onClick={() => choose(index)}><span>{String(item.number).padStart(2, "0")}</span><div><b>{locked ? "Locked challenge" : item.puzzles[0]?.title ?? item.name}</b><small>{item.name}</small></div><em>{done ? "✓ SOLVED" : locked ? "LOCKED" : active === index ? "OPEN" : ""}</em></button>;
        })}<div className="rules"><span>HOW TO PLAY</span><ol><li>เปิด Target Website</li><li>ใช้ DevTools / Network</li><li>หา Flag จาก API</li><li>นำ Flag กลับมาตอบ</li></ol></div></aside>

        {stage && puzzle ? <section className="question-panel"><div className="question-meta"><span>{stage.name}</span><span>QUESTION {String(stage.number).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</span></div><h2>{puzzle.title}</h2><p className="question-text">{puzzle.question}</p>{stage.objective && <div className="objective"><span>OBJECTIVE</span><b>{stage.objective}</b></div>}
          <label htmlFor="flag-input">SUBMIT FLAG <small>CASE SENSITIVE: NO</small></label>
          <div className="flag-input"><input id="flag-input" value={value} disabled={puzzle.solved} maxLength={200} autoComplete="off" onChange={e => { setValue(e.target.value); setStatus("idle"); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder={puzzle.solved ? "Challenge complete" : "FLAG{...}"} /><button onClick={submit} disabled={puzzle.solved || status === "checking"}>{status === "checking" ? "CHECKING..." : "SUBMIT"}</button></div>
          <div aria-live="polite">
            {puzzle.solved && status !== "correct" && <div className="answer-status correct">✓ Already solved · +{stage.scoreEarned} pts</div>}
            {status === "correct" && <div className="answer-status correct">✓ FLAG ACCEPTED — challenge complete{active < stages.length - 1 && <button className="next-challenge" onClick={() => choose(active + 1)}>NEXT CHALLENGE →</button>}</div>}
            {status === "wrong" && <div className="answer-status wrong">× FLAG REJECTED — keep investigating</div>}
            {(status === "error" || message) && <div className="answer-status wrong">× {message || "Could not reach the flag checker — try again"}</div>}
          </div>
          {puzzle.solved && puzzle.explanation && <div className="lesson"><span>WHAT YOU EXPLOITED</span><p>{puzzle.explanation}</p></div>}
          <div className="hint-list">{puzzle.hints.map((hint, i) => {
            const previousUsed = i === 0 || puzzle.hints[i - 1].used;
            return <div key={hint.level} className="question-footer">{hint.used ? <p className="hint-text"><b>HINT {hint.level} · −{hint.deduction}</b>{hint.text}</p>
              : puzzle.solved ? <span>Hint {hint.level} not used</span>
              : <><button onClick={() => openHint(hint.level, hint.deduction)} disabled={busy || !previousUsed}>SHOW HINT {hint.level} (−{hint.deduction} PTS)</button><span>{previousUsed ? "Hint does not reveal the answer" : "Open the previous hint first"}</span></>}</div>;
          })}</div>
        </section> : <section className="question-panel"><p className="empty-line">This stage has no puzzle yet.</p></section>}

        <aside className="score-panel" aria-live="polite"><span>SESSION SCORE</span><strong>{session.finalScore}</strong><small>POINTS</small><div className="score-line"><i style={{ width: `${((game.stats?.solvedStages ?? 0) / Math.max(1, stages.length)) * 100}%` }} /></div><dl className="score-stats"><dt>SOLVED</dt><dd>{game.stats?.solvedStages} / {stages.length}</dd><dt>HINTS USED</dt><dd>{game.stats?.hintsUsed}</dd><dt>ATTEMPTS</dt><dd>{game.stats?.attempts}</dd><dt>ELAPSED</dt><dd>{formatDuration(elapsed)}</dd></dl><p>Complete all {stages.length} challenges to finish the case. Progress is saved on the server.</p></aside>
      </div>}

    {toast.length > 0 && <div className="toast" role="status"><b>ACHIEVEMENT UNLOCKED</b>{toast.map(name => <span key={name}>★ {name}</span>)}<button onClick={() => setToast([])} aria-label="Dismiss">×</button></div>}
    {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
  </Shell>;
}

function Shell({ children, user, onRules, onReset }: { children: React.ReactNode; user?: { username: string; role: string }; onRules?: () => void; onReset?: () => void }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return <main className="answer-app">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><nav className="answer-links">
      {user ? <span>PLAYER: {user.username.toUpperCase()}</span> : <span>PLAYER: GUEST</span>}
      <a href="/leaderboard">LEADERBOARD</a>
      {onRules && <button className="nav-action" onClick={onRules}>HOW TO PLAY</button>}
      {onReset && <button className="nav-action reset" onClick={onReset}>RESET GAME</button>}
      {user?.role === ROLE.admin && <a href="/admin">ADMIN ↗</a>}
      {user ? <button className="nav-action" onClick={logout}>LOGOUT</button> : <><a href="/login">LOGIN</a><a href="/register">REGISTER</a></>}
    </nav></header>
    {children}
    <footer className="answer-footer"><span>BREACH / RESPONSE</span><span>CONTROLLED EDUCATIONAL SIMULATION — NO REAL TARGETS</span></footer>
  </main>;
}

function GuestIntro() {
  return <>
    <section className="answer-intro"><p className="answer-kicker">MISSION CONTROL / SIGN IN TO PLAY</p><h1>Find it.<br /><i>Prove it.</i></h1><p>เกม Web Security Awareness แบบเล่นคนเดียว 5 ด่าน<br />สมัครด้วยอีเมลใดก็ได้ แล้วระบบจะบันทึกคะแนนและความคืบหน้าให้</p><a className="target-button" href="/register">CREATE AN ACCOUNT <span>→</span></a> <a className="ghost-button" href="/login">I ALREADY HAVE ONE</a></section>
    <HowToPlayBody />
  </>;
}

function StartPanel({ room, stages, busy, onStart, error }: { room: NonNullable<GameView["room"]>; stages: number; busy: boolean; onStart: () => void; error: string }) {
  return <section className="start-panel">
    <p className="answer-kicker">BRIEFING / {room.code}</p>
    <h2>{room.name}</h2>
    {room.description && <p className="question-text">{room.description}</p>}
    <p className="question-text">{stages} challenges · difficulty {room.difficulty}</p>
    <HowToPlayBody />
    {error && <p className="answer-status wrong">× {error}</p>}
    <button className="modal-primary" onClick={onStart} disabled={busy}>{busy ? "STARTING…" : "START GAME →"}</button>
  </section>;
}

function HowToPlayBody() {
  return <div className="briefing">
    <ol className="modal-steps">
      <li><b>เปิด Target Website</b><span>เว็บไซต์มหาวิทยาลัยจำลองที่ <code>/target</code> — ดูเหมือนเว็บธรรมดา แต่มีช่องโหว่ซ่อนอยู่ใน API</span></li>
      <li><b>เปิด DevTools → Network</b><span>กด F12 (หรือ Ctrl+Shift+I) แล้วดู Request / Response ที่หน้าเว็บส่งออกไป</span></li>
      <li><b>ทดลองแก้ parameter</b><span>เปลี่ยนค่าใน URL ของ API หรือส่ง Request เองใน tab ใหม่ เพื่อหาข้อมูลที่ไม่ควรเห็น</span></li>
      <li><b>นำ Flag กลับมาตอบ</b><span>Flag มีรูปแบบ <code>FLAG{"{...}"}</code> ด่านถัดไปจะปลดล็อกเมื่อผ่านด่านก่อนหน้า</span></li>
    </ol>
    <div className="modal-rules"><span>SCORING</span><p>ผ่านด่านได้คะแนนเต็มของด่าน (ปกติ 100) · Hint แต่ละระดับหักคะแนนตามที่ระบุ · คะแนนและเวลาบันทึกบน server</p></div>
    <p className="modal-note">ทุกช่องโหว่เป็น simulation ภายในโปรเจกต์นี้เท่านั้น ห้ามนำเทคนิคไปใช้กับระบบจริงโดยไม่ได้รับอนุญาต</p>
  </div>;
}

function HowToPlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title" onClick={e => e.target === e.currentTarget && onClose()}><div className="modal">
    <p className="answer-kicker">BRIEFING / HOW TO PLAY</p>
    <h2 id="how-to-play-title">How to <i>play.</i></h2>
    <HowToPlayBody />
    <button className="modal-primary" onClick={onClose} autoFocus>BACK TO GAME</button>
  </div></div>;
}

function Summary({ game, elapsed, busy, onAgain }: { game: State; elapsed: number; busy: boolean; onAgain: () => void }) {
  const unlocked = game.achievements.filter(a => a.unlockedAt);
  return <section className="summary-panel">
    <p className="answer-kicker">CASE CLOSED / ALL CHALLENGES COMPLETE</p>
    <h2>Mission <i>complete.</i></h2>
    <div className="summary-stats"><div><span>FINAL SCORE</span><strong>{game.session?.finalScore}</strong></div><div><span>TIME TAKEN</span><strong>{formatDuration(elapsed)}</strong></div><div><span>HINTS USED</span><strong>{game.stats?.hintsUsed}</strong></div></div>
    <ul className="summary-list">{game.stages.map(stage => <li key={stage.stageId}><span>{String(stage.number).padStart(2, "0")}</span><div><b>{stage.puzzles[0]?.title ?? stage.name}</b><small>{stage.name}</small></div><em>+{stage.scoreEarned} / {stage.maxScore}</em></li>)}</ul>
    <div className="achievement-grid"><p className="answer-kicker">ACHIEVEMENTS · {unlocked.length} / {game.achievements.length}</p>{game.achievements.map(a => <div key={a.code} className={a.unlockedAt ? "badge on" : "badge"}>{a.icon ? <img src={a.icon} alt="" width={28} height={28} /> : <i>★</i>}<div><b>{a.name}</b><small>{a.description}</small></div></div>)}</div>
    <div className="summary-actions"><button className="modal-primary" onClick={onAgain} disabled={busy}>PLAY AGAIN</button><a className="ghost-button" href="/leaderboard">VIEW LEADERBOARD →</a></div>
  </section>;
}
