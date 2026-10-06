"use client";

import { FormEvent, useState } from "react";

// Only same-site paths are allowed as the post-login destination (no open redirect).
function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: form.get("identifier"), password: form.get("password") }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(data.error ?? "Sign-in failed");
    window.location.href = safeNext();
  }

  return <main className="answer-app auth-page">
    <header className="answer-nav"><a href="/" className="answer-logo"><span>01</span><div>BREACH / RESPONSE<small>SECURITY AWARENESS CHALLENGE</small></div></a><nav className="answer-links"><a href="/leaderboard">LEADERBOARD</a><a href="/register">REGISTER</a></nav></header>
    <form className="auth-card" onSubmit={submit}>
      <p className="answer-kicker">ACCESS / SIGN IN</p>
      <h1>Welcome <i>back.</i></h1>
      <label>EMAIL OR USERNAME<input name="identifier" autoComplete="username" required maxLength={254} /></label>
      <label>PASSWORD<input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
      {error && <p className="answer-status wrong" role="alert">× {error}</p>}
      <button className="modal-primary" disabled={busy}>{busy ? "SIGNING IN…" : "SIGN IN →"}</button>
      <p className="auth-switch">No account yet? <a href="/register">Register with any email</a></p>
    </form>
  </main>;
}
