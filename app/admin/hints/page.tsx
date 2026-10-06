import { requireAdminPage } from "@/lib/auth";
import { getPickers, listHints } from "@/lib/admin";
import { positiveInt } from "@/lib/validation";
import { ActionButton } from "../_components/ActionButton";
import { ResourceForm, type Field } from "../_components/ResourceForm";
import { Editor, Empty, PageHead, Panel } from "../_components/ui";

export default async function AdminHints({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const puzzleId = positiveInt(searchParams.puzzleId);
  const [hints, pickers] = await Promise.all([listHints(puzzleId), getPickers()]);
  const fields: Field[] = [
    { name: "puzzleId", label: "Puzzle", type: "select", required: true, options: pickers.puzzles },
    { name: "hintLevel", label: "Level", type: "number", required: true, min: 1, max: 99, help: "Players must open lower levels first" },
    { name: "deductionScore", label: "Deduction (points)", type: "number", required: true, min: 0, max: 10000 },
    { name: "hintText", label: "Hint text", type: "textarea", required: true, wide: true, maxLength: 1000, help: "Should guide, not reveal the flag" },
  ];

  return <>
    <PageHead kicker="CONTENT / HINT" title="Hints">Each use is recorded once per session in <code>hint_usage</code> with the points deducted at that moment.</PageHead>
    <form className="filter-bar" method="get"><label>PUZZLE<select name="puzzleId" defaultValue={puzzleId ?? ""}><option value="">All puzzles</option>{pickers.puzzles.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label><button>FILTER</button></form>

    <Panel title={`Hints (${hints.length})`}>
      {hints.length === 0 ? <Empty>No hints for this filter.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ROOM · STAGE</th><th>PUZZLE</th><th className="num">LEVEL</th><th>TEXT</th><th className="num">DEDUCTION</th><th className="num">USED</th><th>ACTIONS</th></tr></thead>
        <tbody>{hints.map(h => <tr key={h.hintId}>
          <td>{h.puzzle.stage.room.roomCode} · S{h.puzzle.stage.stageNumber}</td><td>{h.puzzle.puzzleTitle}</td><td className="num">{h.hintLevel}</td><td className="clip">{h.hintText}</td>
          <td className="num">−{h.deductionScore}</td><td className="num">{h._count.usages}</td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/hints/${h.hintId}`} method="DELETE" label="DELETE" danger confirmText="Delete this hint?" />
            <Editor><ResourceForm endpoint={`/api/admin/hints/${h.hintId}`} method="PATCH" fields={fields} compact initial={{ puzzleId: String(h.puzzleId), hintLevel: h.hintLevel, deductionScore: h.deductionScore, hintText: h.hintText }} /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="New hint"><ResourceForm endpoint="/api/admin/hints" fields={fields} initial={{ puzzleId: puzzleId ? String(puzzleId) : undefined, hintLevel: 1, deductionScore: 25 }} submitLabel="CREATE HINT" resetOnSuccess /></Panel>
  </>;
}
