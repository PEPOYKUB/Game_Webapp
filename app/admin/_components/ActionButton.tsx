"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** One-click admin action (toggle, delete, role change). The server enforces the ADMIN role and all rules. */
export function ActionButton({ endpoint, method = "PATCH", body, label, confirmText, danger = false }: { endpoint: string; method?: "POST" | "PATCH" | "DELETE"; body?: unknown; label: string; confirmText?: string; danger?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true); setError("");
    const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(result.error ?? `Failed (${response.status})`);
    router.refresh();
  }

  return <span className="action-wrap"><button type="button" className={danger ? "action danger" : "action"} onClick={run} disabled={busy}>{busy ? "…" : label}</button>{error && <small className="form-error" role="alert">{error}</small>}</span>;
}
