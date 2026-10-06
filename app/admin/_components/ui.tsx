// Small server-safe presentational helpers for the admin pages.
export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return <div className="admin-head"><p className="answer-kicker">{kicker}</p><h1>{title}</h1>{children && <div className="admin-head-note">{children}</div>}</div>;
}

export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function Panel({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return <section className="admin-panel"><div className="admin-panel-head"><h2>{title}</h2>{aside}</div>{children}</section>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty-line">{children}</p>;
}

/** Collapsible inline editor row. */
export function Editor({ label = "EDIT", children }: { label?: string; children: React.ReactNode }) {
  return <details className="editor"><summary>{label}</summary>{children}</details>;
}

/** Page links that keep the current query string (filters) and only change ?page=. */
export function Pager({ page, pages, total, params, path }: { page: number; pages: number; total: number; params: Record<string, string | string[] | undefined>; path: string }) {
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string" && value && key !== "page") query.set(key, value);
    query.set("page", String(target));
    return `${path}?${query}`;
  };
  return <nav className="pager" aria-label="Pagination"><span>{total} record(s) · page {page} / {pages}</span>{page > 1 && <a href={href(page - 1)}>← PREV</a>}{page < pages && <a href={href(page + 1)}>NEXT →</a>}</nav>;
}

export function Badge({ tone = "neutral", children }: { tone?: "good" | "bad" | "warn" | "neutral"; children: React.ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
