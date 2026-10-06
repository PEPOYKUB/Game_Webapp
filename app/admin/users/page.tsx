import { requireAdminPage } from "@/lib/auth";
import { listUsers } from "@/lib/admin";
import { ROLE, USER_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getFilterOptions } from "@/lib/stats";
import { ActionButton } from "../_components/ActionButton";
import { Badge, Empty, PageHead, Pager, Panel } from "../_components/ui";

export default async function AdminUsers({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const admin = await requireAdminPage();
  const [result, options] = await Promise.all([listUsers(searchParams), getFilterOptions()]);

  return <>
    <PageHead kicker="PEOPLE / APP_USER" title="Users">New accounts are always PLAYER. Promote here, or set <code>ADMIN_EMAIL</code> and run the seed. Passwords are bcrypt hashes and are never shown.</PageHead>
    <form className="filter-bar" method="get">
      <label>SEARCH<input name="q" defaultValue={searchParams.q ?? ""} placeholder="username, email, name, student id" maxLength={100} /></label>
      <label>ROLE<select name="role" defaultValue={searchParams.role ?? ""}><option value="">All</option>{Object.values(ROLE).map(r => <option key={r}>{r}</option>)}</select></label>
      <label>STATUS<select name="status" defaultValue={searchParams.status ?? ""}><option value="">All</option>{Object.values(USER_STATUS).map(s => <option key={s}>{s}</option>)}</select></label>
      <label>FACULTY<select name="facultyId" defaultValue={searchParams.facultyId ?? ""}><option value="">All</option>{options.faculties.map(f => <option key={f.facultyId} value={f.facultyId}>{f.facultyCode}</option>)}</select></label>
      <label>YEAR<select name="yearLevel" defaultValue={searchParams.yearLevel ?? ""}><option value="">All</option>{options.yearLevels.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
      <button>FILTER</button><a href="/admin/users">RESET</a>
    </form>

    <Panel title={`Users (${result.total})`}>
      {result.users.length === 0 ? <Empty>No users match.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>USERNAME</th><th>NAME</th><th>EMAIL</th><th>STUDENT ID</th><th>FACULTY</th><th className="num">YEAR</th><th>ROLE</th><th>STATUS</th><th className="num">SESSIONS</th><th className="num">BEST</th><th className="num">BADGES</th><th>JOINED</th><th>ACTIONS</th></tr></thead>
        <tbody>{result.users.map(u => {
          const self = u.userId === admin.userId;
          return <tr key={u.userId}>
            <td><b>{u.username}</b>{self && <small> (you)</small>}</td><td>{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.studentId ?? "—"}</td><td>{u.faculty ?? "—"}</td><td className="num">{u.yearLevel ?? "—"}</td>
            <td><Badge tone={u.role === ROLE.admin ? "warn" : "neutral"}>{u.role}</Badge></td><td><Badge tone={u.status === USER_STATUS.active ? "good" : "bad"}>{u.status}</Badge></td>
            <td className="num">{u.completed}/{u.sessions}</td><td className="num">{u.bestScore ?? "—"}</td><td className="num">{u.achievements}</td><td>{formatDateTime(u.createdAt)}</td>
            <td className="actions">{!self && <>
              <ActionButton endpoint={`/api/admin/users/${u.userId}`} body={{ role: u.role === ROLE.admin ? ROLE.player : ROLE.admin }} label={u.role === ROLE.admin ? "MAKE PLAYER" : "MAKE ADMIN"} confirmText={`Change ${u.username} to ${u.role === ROLE.admin ? ROLE.player : ROLE.admin}?`} />
              <ActionButton endpoint={`/api/admin/users/${u.userId}`} body={{ status: u.status === USER_STATUS.active ? USER_STATUS.suspended : USER_STATUS.active }} label={u.status === USER_STATUS.active ? "SUSPEND" : "REACTIVATE"} danger={u.status === USER_STATUS.active} />
            </>}</td>
          </tr>;
        })}</tbody>
      </table></div>}
      <Pager page={result.page} pages={result.pages} total={result.total} params={searchParams} path="/admin/users" />
    </Panel>
  </>;
}
