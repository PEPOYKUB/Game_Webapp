import { requireAdminPage } from "@/lib/auth";
import { getPickers, listStages } from "@/lib/admin";
import { positiveInt } from "@/lib/validation";
import { ActionButton } from "../_components/ActionButton";
import { ResourceForm, type Field } from "../_components/ResourceForm";
import { Editor, Empty, PageHead, Panel } from "../_components/ui";

export default async function AdminStages({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const roomId = positiveInt(searchParams.roomId);
  const [stages, pickers] = await Promise.all([listStages(roomId), getPickers()]);
  const fields: Field[] = [
    { name: "roomId", label: "Room", type: "select", required: true, options: pickers.rooms },
    { name: "stageNumber", label: "Stage number", type: "number", required: true, min: 1, max: 999, help: "Players unlock stages in this order" },
    { name: "stageName", label: "Stage name", required: true, maxLength: 100, placeholder: "WEB-06 / ..." },
    { name: "maxScore", label: "Max score", type: "number", required: true, min: 0, max: 100000 },
    { name: "storylineText", label: "Storyline / objective", type: "textarea", wide: true, maxLength: 2000 },
  ];

  return <>
    <PageHead kicker="CONTENT / STAGE" title="Stages">A stage is one step in a room. Its puzzles must all be solved to unlock the next stage.</PageHead>
    <form className="filter-bar" method="get"><label>ROOM<select name="roomId" defaultValue={roomId ?? ""}><option value="">All rooms</option>{pickers.rooms.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label><button>FILTER</button></form>

    <Panel title={`Stages (${stages.length})`}>
      {stages.length === 0 ? <Empty>No stages for this filter.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ROOM</th><th className="num">#</th><th>NAME</th><th>STORYLINE</th><th className="num">MAX</th><th className="num">PUZZLES</th><th className="num">PLAYED</th><th>ACTIONS</th></tr></thead>
        <tbody>{stages.map(s => <tr key={s.stageId}>
          <td>{s.room.roomCode}</td><td className="num">{s.stageNumber}</td><td><b>{s.stageName}</b></td><td className="clip">{s.storylineText ?? "—"}</td>
          <td className="num">{s.maxScore}</td><td className="num"><a href={`/admin/puzzles?stageId=${s.stageId}`}>{s._count.puzzles}</a></td><td className="num">{s._count.progress}</td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/stages/${s.stageId}`} method="DELETE" label="DELETE" danger confirmText={`Delete stage ${s.stageNumber} (${s.stageName}) with its puzzles and hints?`} />
            <Editor><ResourceForm endpoint={`/api/admin/stages/${s.stageId}`} method="PATCH" fields={fields} compact initial={{ roomId: String(s.roomId), stageNumber: s.stageNumber, stageName: s.stageName, maxScore: s.maxScore, storylineText: s.storylineText }} /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="New stage"><ResourceForm endpoint="/api/admin/stages" fields={fields} initial={{ roomId: roomId ? String(roomId) : undefined, maxScore: 100 }} submitLabel="CREATE STAGE" resetOnSuccess /></Panel>
  </>;
}
