"use client";

import { FormEvent, useEffect, useState } from "react";

type Faculty = { facultyId: number; facultyCode: string; facultyNameTh: string; facultyNameEn: string };

export default function RegisterPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/faculties").then(r => r.json()).then(d => setFaculties(d.faculties ?? [])).catch(() => setFaculties([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true); setError("");
    // Role is never sent: the server always creates a PLAYER account.
    const { confirm: _confirm, ...body } = form;
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(data.error ?? "Registration failed");
    window.location.href = "/";
  }

  return <main className="answer-app auth-page">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><nav className="answer-links"><a href="/leaderboard">LEADERBOARD</a><a href="/login">LOGIN</a></nav></header>
    <form className="auth-card wide" onSubmit={submit}>
      <p className="answer-kicker">ACCESS / CREATE ACCOUNT</p>
      <h1>Join the <i>case.</i></h1>
      <p className="auth-note">ใช้อีเมลใดก็ได้ (Gmail, Outlook, อีเมลมหาวิทยาลัย ฯลฯ)</p>
      <div className="auth-grid">
        <label>USERNAME<input name="username" autoComplete="username" required minLength={3} maxLength={50} pattern="[A-Za-z0-9_.\-]{3,50}" title="3–50 characters: letters, numbers, _ . -" /></label>
        <label>EMAIL<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>FIRST NAME<input name="firstName" autoComplete="given-name" required maxLength={50} /></label>
        <label>LAST NAME<input name="lastName" autoComplete="family-name" required maxLength={50} /></label>
        <label>PASSWORD<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>
        <label>CONFIRM PASSWORD<input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>
        <label>FACULTY <small>OPTIONAL</small><select name="facultyId" defaultValue=""><option value="">— Not specified —</option>{faculties.map(f => <option key={f.facultyId} value={f.facultyId}>{f.facultyNameTh} / {f.facultyNameEn}</option>)}</select></label>
        <label>YEAR LEVEL <small>OPTIONAL</small><select name="yearLevel" defaultValue=""><option value="">—</option>{[1, 2, 3, 4, 5, 6, 7, 8].map(y => <option key={y} value={y}>{y}</option>)}</select></label>
        <label>STUDENT ID <small>OPTIONAL</small><input name="studentId" maxLength={20} pattern="[A-Za-z0-9\-]{1,20}" /></label>
      </div>
      {error && <p className="answer-status wrong" role="alert">× {error}</p>}
      <button className="modal-primary" disabled={busy}>{busy ? "CREATING…" : "CREATE ACCOUNT →"}</button>
      <p className="auth-switch">Already registered? <a href="/login">Sign in</a></p>
    </form>
  </main>;
}
