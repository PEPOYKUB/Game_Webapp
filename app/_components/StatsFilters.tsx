import type { getFilterOptions, StatsFilters as Filters } from "@/lib/stats";

// Plain GET form, so filters live in the URL and work without client JavaScript.
export function StatsFilters({ options, filters, action }: { options: Awaited<ReturnType<typeof getFilterOptions>>; filters: Filters; action: string }) {
  return <form className="filter-bar" action={action} method="get">
    <label>ROOM<select name="roomId" defaultValue={filters.roomId ?? ""}><option value="">All rooms</option>{options.rooms.map(r => <option key={r.roomId} value={r.roomId}>{r.roomCode} — {r.roomName}</option>)}</select></label>
    <label>FACULTY<select name="facultyId" defaultValue={filters.facultyId ?? ""}><option value="">All faculties</option>{options.faculties.map(f => <option key={f.facultyId} value={f.facultyId}>{f.facultyCode} — {f.facultyNameEn}</option>)}</select></label>
    <label>YEAR<select name="yearLevel" defaultValue={filters.yearLevel ?? ""}><option value="">All years</option>{options.yearLevels.map(y => <option key={y} value={y}>Year {y}</option>)}</select></label>
    <button>APPLY</button>
    <a href={action}>RESET</a>
  </form>;
}
