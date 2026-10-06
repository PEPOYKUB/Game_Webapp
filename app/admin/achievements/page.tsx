import { requireAdminPage } from "@/lib/auth";
import { listAchievements } from "@/lib/admin";
import { AUTO_ACHIEVEMENTS } from "@/lib/game";
import { formatDateTime } from "@/lib/format";
import { ActionButton } from "../_components/ActionButton";
import { ResourceForm, type Field } from "../_components/ResourceForm";
import { Badge, Editor, Empty, PageHead, Panel } from "../_components/ui";

const fields: Field[] = [
  { name: "achievementCode", label: "Code", required: true, maxLength: 30, placeholder: "NIGHT_OWL", help: "A–Z, 0–9 and _" },
  { name: "achievementName", label: "Name", required: true, maxLength: 100 },
  { name: "badgeIconUrl", label: "Badge icon URL", maxLength: 255, placeholder: "/badges/flawless.svg", help: "Site path or https:// URL" },
  { name: "description", label: "Description", type: "textarea", wide: true, maxLength: 500 },
  { name: "criteriaCondition", label: "Criteria (documentation)", type: "textarea", wide: true, maxLength: 500 },
];
const userField: Field[] = [{ name: "username", label: "Username", required: true, maxLength: 50 }];

export default async function AdminAchievements() {
  await requireAdminPage();
  const achievements = await listAchievements();
  return <>
    <PageHead kicker="REWARDS / ACHIEVEMENT · USER_ACHIEVEMENT" title="Achievements">Codes {AUTO_ACHIEVEMENTS.join(", ")} are awarded automatically by the game engine. Any other achievement is awarded manually below.</PageHead>

    <Panel title={`Achievements (${achievements.length})`}>
      {achievements.length === 0 ? <Empty>No achievements yet.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>BADGE</th><th>CODE</th><th>NAME</th><th>DESCRIPTION</th><th>CRITERIA</th><th className="num">HOLDERS</th><th>RECENT</th><th>ACTIONS</th></tr></thead>
        <tbody>{achievements.map(a => <tr key={a.achievementId}>
          <td>{a.badgeIconUrl ? <img src={a.badgeIconUrl} alt="" width={28} height={28} /> : "★"}</td>
          <td><b>{a.achievementCode}</b><br /><Badge tone={(AUTO_ACHIEVEMENTS as readonly string[]).includes(a.achievementCode) ? "good" : "neutral"}>{(AUTO_ACHIEVEMENTS as readonly string[]).includes(a.achievementCode) ? "AUTO" : "MANUAL"}</Badge></td>
          <td>{a.achievementName}</td><td className="clip">{a.description ?? "—"}</td><td className="clip mono">{a.criteriaCondition ?? "—"}</td><td className="num">{a._count.users}</td>
          <td>{a.users.map(u => <div key={u.user.username}><small>{u.user.username} · {formatDateTime(u.unlockedAt)}</small></div>)}</td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/achievements/${a.achievementId}`} method="DELETE" label="DELETE" danger confirmText={`Delete ${a.achievementCode}? Every player loses this badge.`} />
            <Editor><ResourceForm endpoint={`/api/admin/achievements/${a.achievementId}`} method="PATCH" fields={fields} compact initial={{ achievementCode: a.achievementCode, achievementName: a.achievementName, badgeIconUrl: a.badgeIconUrl, description: a.description, criteriaCondition: a.criteriaCondition }} /></Editor>
            <Editor label="AWARD"><ResourceForm endpoint={`/api/admin/achievements/${a.achievementId}/award`} fields={userField} compact submitLabel="AWARD" resetOnSuccess /></Editor>
            <Editor label="REVOKE"><ResourceForm endpoint={`/api/admin/achievements/${a.achievementId}/award`} method="DELETE" fields={userField} compact submitLabel="REVOKE" resetOnSuccess /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="New achievement"><ResourceForm endpoint="/api/admin/achievements" fields={fields} submitLabel="CREATE ACHIEVEMENT" resetOnSuccess /></Panel>
  </>;
}
