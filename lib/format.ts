// Formatting helpers shared by client and server components.
export function formatDuration(ms: number | null | undefined) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

export const formatPercent = (ratio: number | null | undefined) => (ratio === null || ratio === undefined ? "—" : `${Math.round(ratio * 100)}%`);

export const formatDateTime = (value: Date | string | null | undefined) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }) : "—";
