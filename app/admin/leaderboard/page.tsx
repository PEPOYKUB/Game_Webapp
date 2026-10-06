import { requireAdminPage } from "@/lib/auth";
import { getFilterOptions, getLeaderboard, parseFilters } from "@/lib/stats";
import { LeaderboardTable } from "@/app/_components/LeaderboardTable";
import { StatsFilters } from "@/app/_components/StatsFilters";
import { PageHead, Panel } from "../_components/ui";

export default async function AdminLeaderboard({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const filters = parseFilters(searchParams);
  const [rows, options] = await Promise.all([getLeaderboard(filters, 200), getFilterOptions()]);
  return <>
    <PageHead kicker="RESULTS / LEADERBOARD" title="Leaderboard">Best completed run per player and room — highest score first, then shortest time. Admin accounts and suspended players are not ranked.</PageHead>
    <StatsFilters options={options} filters={filters} action="/admin/leaderboard" />
    <Panel title={`Ranked runs (${rows.length})`}><LeaderboardTable rows={rows} admin /></Panel>
  </>;
}
