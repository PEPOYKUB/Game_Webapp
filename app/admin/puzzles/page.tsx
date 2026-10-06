import { requireAdminPage } from "@/lib/auth";
import { getPickers, listPuzzles } from "@/lib/admin";
import { BUILT_IN_FLAG_KEYS } from "@/lib/constants";
import { positiveInt } from "@/lib/validation";
import { ActionButton } from "../_components/ActionButton";
import { ResourceForm, type Field } from "../_components/ResourceForm";
import { Badge, Editor, Empty, PageHead, Panel } from "../_components/ui";

const flagLabels: Record<string, string> = { idor: "WEB-01 IDOR (article)", param: "WEB-02 Parameter tampering (profile)", leak: "WEB-03 Info disclosure (search)", archive: "Hidden archive endpoint", traversal: "WEB-04 Path traversal (files)", ssrf: "WEB-05 SSRF (proxy)" };

export default async function AdminPuzzles({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdminPage();
  const stageId = positiveInt(searchParams.stageId);
  const [puzzles, pickers] = await Promise.all([listPuzzles(stageId), getPickers()]);

  const contentFields: Field[] = [
    { name: "stageId", label: "Stage", type: "select", required: true, options: pickers.stages },
    { name: "puzzleTitle", label: "Title", required: true, maxLength: 100 },
    { name: "puzzleType", label: "Type", required: true, maxLength: 30, placeholder: "IDOR", help: "A–Z, 0–9, _ and -" },
    { name: "questionText", label: "Question", type: "textarea", required: true, wide: true, maxLength: 2000 },
    { name: "explanationText", label: "Explanation (shown after solving)", type: "textarea", wide: true, maxLength: 1000 },
  ];
  const answerFields = (creating: boolean): Field[] => [
    { name: "answerSource", label: creating ? "Answer source" : "Replace answer", type: "select", required: creating, options: [{ value: "flag", label: "Built-in Target Website flag" }, { value: "custom", label: "Custom answer text" }], help: creating ? undefined : "Leave empty to keep the current answer" },
    { name: "flagKey", label: "Built-in flag", type: "select", options: BUILT_IN_FLAG_KEYS.map(key => ({ value: key, label: flagLabels[key] })), help: "Derived from FLAG_SECRET on the server — never displayed" },
    { name: "answer", label: "Custom answer", type: "password", maxLength: 200, help: "Write-only: hashed immediately, never shown again" },
  ];

  return <>
    <PageHead kicker="CONTENT / PUZZLE" title="Puzzles">Answers are stored only as a keyed HMAC in <code>correct_answer_hash</code>. This page shows where an answer comes from, never the answer or the flag.</PageHead>
    <form className="filter-bar" method="get"><label>STAGE<select name="stageId" defaultValue={stageId ?? ""}><option value="">All stages</option>{pickers.stages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label><button>FILTER</button>
      <span className="spacer" /><ActionButton endpoint="/api/admin/puzzles/resync" method="POST" label="RESYNC BUILT-IN FLAG HASHES" confirmText="Recompute answer hashes for puzzles that use built-in flags (needed after FLAG_SECRET changes)?" /></form>

    <Panel title={`Puzzles (${puzzles.length})`}>
      {puzzles.length === 0 ? <Empty>No puzzles for this filter.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ROOM · STAGE</th><th>TITLE</th><th>TYPE</th><th>QUESTION</th><th>ANSWER SOURCE</th><th className="num">HINTS</th><th className="num">ATTEMPTS</th><th>ACTIONS</th></tr></thead>
        <tbody>{puzzles.map(p => <tr key={p.puzzleId}>
          <td>{p.stage.room.roomCode} · S{p.stage.stageNumber}</td><td><b>{p.puzzleTitle}</b></td><td>{p.puzzleType}</td><td className="clip">{p.questionText}</td>
          <td><Badge tone={p.answerSource.startsWith("flag:") ? "good" : "neutral"}>{p.answerSource}</Badge></td>
          <td className="num"><a href={`/admin/hints?puzzleId=${p.puzzleId}`}>{p._count.hints}</a></td><td className="num">{p._count.attempts}</td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/puzzles/${p.puzzleId}`} method="DELETE" label="DELETE" danger confirmText={`Delete puzzle "${p.puzzleTitle}" and its hints?`} />
            <Editor><ResourceForm endpoint={`/api/admin/puzzles/${p.puzzleId}`} method="PATCH" fields={[...contentFields, ...answerFields(false)]} compact initial={{ stageId: String(p.stageId), puzzleTitle: p.puzzleTitle, puzzleType: p.puzzleType, questionText: p.questionText, explanationText: p.explanationText }} /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="New puzzle"><ResourceForm endpoint="/api/admin/puzzles" fields={[...contentFields, ...answerFields(true)]} initial={{ stageId: stageId ? String(stageId) : undefined }} submitLabel="CREATE PUZZLE" resetOnSuccess /></Panel>
  </>;
}
