"use client";

import { useEffect, useState } from "react";
import { challenges, HINT_PENALTY, POINTS_PER_CHALLENGE, type ChallengeId } from "@/lib/challenges";

type GameState = { startedAt: number | null; finishedAt: number | null; solved: ChallengeId[]; hints: ChallengeId[] };
type Status = "idle" | "checking" | "correct" | "wrong" | "error";

const STORAGE_KEY = "cyberescape-kku:progress:v1";
const emptyState: GameState = { startedAt: null, finishedAt: null, solved: [], hints: [] };

function loadState(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return emptyState;
    const known = (list: unknown) => (Array.isArray(list) ? list.filter((id): id is ChallengeId => challenges.some(c => c.id === id)) : []);
    const solved = known(saved.solved);
    // finishedAt only counts if every current challenge is solved (new challenges may have been added since).
    const finishedAt = typeof saved.finishedAt === "number" && solved.length === challenges.length ? saved.finishedAt : null;
    return { startedAt: typeof saved.startedAt === "number" ? saved.startedAt : null, finishedAt, solved, hints: known(saved.hints) };
  } catch {
    return emptyState;
  }
}

function saveState(state: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable — progress lasts this tab only */ }
}

function scoreOf(state: GameState) {
  return Math.max(0, state.solved.length * POINTS_PER_CHALLENGE - state.hints.length * HINT_PENALTY);
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

const isUnlocked = (state: GameState, index: number) => index === 0 || state.solved.includes(challenges[index - 1].id);
const firstOpenIndex = (state: GameState) => Math.max(0, challenges.findIndex(c => !state.solved.includes(c.id)));

export default function AnswerWeb() {
  const [game, setGame] = useState<GameState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [active, setActive] = useState(0);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => { const saved = loadState(); setGame(saved); setActive(firstOpenIndex(saved)); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveState(game); }, [game, loaded]);
  useEffect(() => {
    if (!game.startedAt || game.finishedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [game.startedAt, game.finishedAt]);

  const challenge = challenges[active];
  const solved = game.solved.includes(challenge.id);
  const hintUsed = game.hints.includes(challenge.id);
  const finished = game.solved.length === challenges.length;
  const elapsed = game.startedAt ? (game.finishedAt ?? now) - game.startedAt : 0;

  function startGame() { setGame({ ...emptyState, startedAt: Date.now() }); setActive(0); setShowRules(false); }
  function resetGame() {
    if (!confirm("Reset all progress, score and hints?")) return;
    setGame(emptyState); setActive(0); setValue(""); setStatus("idle");
  }
  function choose(index: number) { if (!isUnlocked(game, index)) return; setActive(index); setValue(""); setStatus("idle"); }
  function revealHint() { if (!hintUsed) setGame(prev => ({ ...prev, hints: [...prev.hints, challenge.id] })); }

  async function submit() {
    if (solved || !value.trim() || status === "checking") return;
    setStatus("checking");
    try {
      const response = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, flag: value }) });
      if (!response.ok) throw new Error(String(response.status));
      const result: { correct?: boolean } = await response.json();
      if (!result.correct) return setStatus("wrong");
      setStatus("correct");
      setGame(prev => {
        if (prev.solved.includes(challenge.id)) return prev;
        const nextSolved = [...prev.solved, challenge.id];
        return { ...prev, solved: nextSolved, finishedAt: nextSolved.length === challenges.length ? Date.now() : prev.finishedAt };
      });
    } catch {
      setStatus("error");
    }
  }

  return <main className="answer-app">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><div className="answer-links"><span>PLAYER: GUEST</span><button className="nav-action" onClick={() => setShowRules(true)}>HOW TO PLAY</button>{game.startedAt && <button className="nav-action reset" onClick={resetGame}>RESET GAME</button>}<a href="/target">OPEN TARGET WEBSITE ↗</a></div></header>
    <section className="answer-intro"><p className="answer-kicker">MISSION CONTROL / SUBMIT YOUR FINDINGS</p><h1>Find it.<br /><i>Prove it.</i></h1><p>คำตอบที่ถูกต้องไม่ได้อยู่ในหน้านี้<br />เปิด Target Website แล้วค้นหาหลักฐานจาก API</p><a className="target-button" href="/target">GO TO TARGET WEBSITE <span>↗</span></a></section>

    {finished ? <Summary game={game} elapsed={elapsed} onReset={resetGame} /> : <div className="answer-grid">
      <aside className="challenge-nav"><div className="answer-section-label">CHALLENGES <b>0{challenges.length}</b></div>{challenges.map((item, index) => {
        const locked = !isUnlocked(game, index); const done = game.solved.includes(item.id);
        return <button key={item.id} className={[active === index ? "active" : "", locked ? "locked" : "", done ? "done" : ""].join(" ").trim()} disabled={locked} onClick={() => choose(index)}><span>0{index + 1}</span><div><b>{locked ? "Locked challenge" : item.title}</b><small>{item.tag}</small></div><em>{done ? "✓ SOLVED" : locked ? "LOCKED" : active === index ? "OPEN" : ""}</em></button>;
      })}<div className="rules"><span>HOW TO PLAY</span><ol><li>เปิด Target Website</li><li>ใช้ DevTools / Network</li><li>หา Flag จาก API</li><li>นำ Flag กลับมาตอบ</li></ol></div></aside>

      <section className="question-panel"><div className="question-meta"><span>{challenge.tag}</span><span>QUESTION 0{active + 1} / 0{challenges.length}</span></div><h2>{challenge.title}</h2><p className="question-text">{challenge.text}</p><div className="objective"><span>OBJECTIVE</span><b>{challenge.target}</b></div>
        <label>SUBMIT FLAG <small>CASE SENSITIVE: NO</small></label>
        <div className="flag-input"><input value={value} disabled={solved} onChange={e => { setValue(e.target.value); setStatus("idle"); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder={solved ? "Challenge complete" : "FLAG{...}"} /><button onClick={submit} disabled={solved || status === "checking"}>{status === "checking" ? "CHECKING..." : "SUBMIT"}</button></div>
        {solved && status !== "correct" && <div className="answer-status correct">✓ Already solved</div>}
        {status === "correct" && <div className="answer-status correct">✓ FLAG ACCEPTED — challenge complete{active < challenges.length - 1 && <button className="next-challenge" onClick={() => choose(active + 1)}>NEXT CHALLENGE →</button>}</div>}
        {status === "wrong" && <div className="answer-status wrong">× FLAG REJECTED — keep investigating</div>}
        {status === "error" && <div className="answer-status wrong">× Could not reach the flag checker — try again</div>}
        <div className="question-footer">{hintUsed ? <p className="hint-text"><b>HINT</b>{challenge.hint}</p> : <><button onClick={revealHint}>SHOW HINT (−{HINT_PENALTY} PTS)</button><span>Hint does not reveal the answer</span></>}</div>
      </section>

      <aside className="score-panel"><span>SESSION SCORE</span><strong>{scoreOf(game)}</strong><small>POINTS</small><div className="score-line"><i style={{ width: `${(game.solved.length / challenges.length) * 100}%` }} /></div><dl className="score-stats"><dt>SOLVED</dt><dd>{game.solved.length} / {challenges.length}</dd><dt>HINTS USED</dt><dd>{game.hints.length}</dd><dt>ELAPSED</dt><dd>{formatDuration(elapsed)}</dd></dl><p>Complete all {challenges.length} challenges to finish the case.</p></aside>
    </div>}

    <footer className="answer-footer"><span>BREACH / RESPONSE</span><span>CONTROLLED EDUCATIONAL SIMULATION — NO REAL TARGETS</span></footer>
    {loaded && (!game.startedAt || showRules) && <HowToPlay started={Boolean(game.startedAt)} onStart={startGame} onClose={() => setShowRules(false)} />}
  </main>;
}

function HowToPlay({ started, onStart, onClose }: { started: boolean; onStart: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title"><div className="modal">
    <p className="answer-kicker">BRIEFING / BEFORE YOU START</p>
    <h2 id="how-to-play-title">How to <i>play.</i></h2>
    <ol className="modal-steps">
      <li><b>เปิด Target Website</b><span>เว็บไซต์มหาวิทยาลัยจำลองที่ <code>/target</code> — ดูเหมือนเว็บธรรมดา แต่มีช่องโหว่ซ่อนอยู่ใน API</span></li>
      <li><b>เปิด DevTools → Network</b><span>กด F12 (หรือ Ctrl+Shift+I) แล้วดู Request / Response ที่หน้าเว็บส่งออกไป</span></li>
      <li><b>ทดลองแก้ parameter</b><span>เปลี่ยนค่าใน URL ของ API หรือส่ง Request เองใน tab ใหม่ เพื่อหาข้อมูลที่ไม่ควรเห็น</span></li>
      <li><b>นำ Flag กลับมาตอบ</b><span>Flag มีรูปแบบ <code>FLAG{"{...}"}</code> ด่านถัดไปจะปลดล็อกเมื่อผ่านด่านก่อนหน้า</span></li>
    </ol>
    <div className="modal-rules"><span>SCORING</span><p>ด่านละ {POINTS_PER_CHALLENGE} คะแนน · ใช้ Hint หัก {HINT_PENALTY} คะแนน · ความคืบหน้าบันทึกไว้ในเบราว์เซอร์นี้</p></div>
    <p className="modal-note">ทุกช่องโหว่เป็น simulation ภายในโปรเจกต์นี้เท่านั้น ห้ามนำเทคนิคไปใช้กับระบบจริงโดยไม่ได้รับอนุญาต</p>
    {started ? <button className="modal-primary" onClick={onClose}>BACK TO GAME</button> : <button className="modal-primary" onClick={onStart}>START GAME →</button>}
  </div></div>;
}

function Summary({ game, elapsed, onReset }: { game: GameState; elapsed: number; onReset: () => void }) {
  return <section className="summary-panel">
    <p className="answer-kicker">CASE CLOSED / ALL CHALLENGES COMPLETE</p>
    <h2>Mission <i>complete.</i></h2>
    <div className="summary-stats"><div><span>FINAL SCORE</span><strong>{scoreOf(game)}</strong></div><div><span>TIME TAKEN</span><strong>{formatDuration(elapsed)}</strong></div><div><span>HINTS USED</span><strong>{game.hints.length}</strong></div></div>
    <ul className="summary-list">{challenges.map((item, index) => <li key={item.id}><span>0{index + 1}</span><div><b>{item.title}</b><small>{item.tag}</small></div><em>{game.hints.includes(item.id) ? `HINT −${HINT_PENALTY}` : "NO HINT"}</em></li>)}</ul>
    <button className="modal-primary" onClick={onReset}>RESET GAME</button>
  </section>;
}
