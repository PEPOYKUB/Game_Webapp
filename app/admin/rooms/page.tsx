import { requireAdminPage } from "@/lib/auth";
import { listCategories, listRooms } from "@/lib/admin";
import { DIFFICULTIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { ActionButton } from "../_components/ActionButton";
import { ResourceForm, type Field } from "../_components/ResourceForm";
import { Badge, Editor, Empty, PageHead, Panel } from "../_components/ui";

export default async function AdminRooms() {
  await requireAdminPage();
  const [rooms, categories] = await Promise.all([listRooms(), listCategories()]);
  const categoryOptions = categories.map(c => ({ value: String(c.categoryId), label: c.categoryName }));
  const roomFields: Field[] = [
    { name: "roomCode", label: "Room code", required: true, maxLength: 20, placeholder: "KKU-WEB-02", help: "A–Z, 0–9, _ and -" },
    { name: "roomName", label: "Room name", required: true, maxLength: 100 },
    { name: "difficultyLevel", label: "Difficulty", type: "select", required: true, options: DIFFICULTIES.map(d => ({ value: d, label: d })) },
    { name: "isActive", label: "Active (players can see it)", type: "checkbox" },
    { name: "description", label: "Description", type: "textarea", wide: true, maxLength: 1000 },
    { name: "categoryIds", label: "Categories", type: "multi", wide: true, options: categoryOptions },
  ];
  const categoryFields: Field[] = [
    { name: "categoryName", label: "Category name", required: true, maxLength: 50 },
    { name: "categoryDescription", label: "Description", maxLength: 255, wide: true },
  ];

  return <>
    <PageHead kicker="CONTENT / ROOM · CATEGORY · ROOM_CATEGORY" title="Rooms & Categories">Players play the active rooms; a room needs at least one stage, and a puzzle in every stage, before it appears in the game.</PageHead>

    <Panel title={`Rooms (${rooms.length})`}>
      {rooms.length === 0 ? <Empty>No rooms yet.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>CODE</th><th>NAME</th><th>DIFFICULTY</th><th>CATEGORIES</th><th className="num">STAGES</th><th className="num">SESSIONS</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr></thead>
        <tbody>{rooms.map(room => <tr key={room.roomId}>
          <td><b>{room.roomCode}</b></td><td>{room.roomName}</td><td>{room.difficultyLevel}</td>
          <td>{room.categories.map(c => c.category.categoryName).join(", ") || "—"}</td>
          <td className="num"><a href={`/admin/stages?roomId=${room.roomId}`}>{room._count.stages}</a></td><td className="num">{room._count.sessions}</td>
          <td><Badge tone={room.isActive ? "good" : "neutral"}>{room.isActive ? "ACTIVE" : "INACTIVE"}</Badge></td>
          <td>{formatDateTime(room.createdAt)}<br /><small>{room.creator?.username ?? "seed"}</small></td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/rooms/${room.roomId}`} body={{ isActive: !room.isActive }} label={room.isActive ? "DEACTIVATE" : "ACTIVATE"} />
            <ActionButton endpoint={`/api/admin/rooms/${room.roomId}`} method="DELETE" label="DELETE" danger confirmText={`Delete room ${room.roomCode} and all its stages, puzzles and hints?`} />
            <Editor><ResourceForm endpoint={`/api/admin/rooms/${room.roomId}`} method="PATCH" fields={roomFields} compact initial={{ roomCode: room.roomCode, roomName: room.roomName, difficultyLevel: room.difficultyLevel, isActive: room.isActive, description: room.description, categoryIds: room.categories.map(c => String(c.categoryId)) }} /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </Panel>

    <Panel title="New room"><ResourceForm endpoint="/api/admin/rooms" fields={roomFields} initial={{ isActive: true, difficultyLevel: "EASY" }} submitLabel="CREATE ROOM" resetOnSuccess /></Panel>

    <Panel title={`Categories (${categories.length})`}>
      {categories.length === 0 ? <Empty>No categories yet.</Empty> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>NAME</th><th>DESCRIPTION</th><th className="num">ROOMS</th><th>ACTIONS</th></tr></thead>
        <tbody>{categories.map(c => <tr key={c.categoryId}>
          <td><b>{c.categoryName}</b></td><td>{c.categoryDescription ?? "—"}</td><td className="num">{c._count.rooms}</td>
          <td className="actions">
            <ActionButton endpoint={`/api/admin/categories/${c.categoryId}`} method="DELETE" label="DELETE" danger confirmText={`Delete category ${c.categoryName}? Rooms keep existing; only the link is removed.`} />
            <Editor><ResourceForm endpoint={`/api/admin/categories/${c.categoryId}`} method="PATCH" fields={categoryFields} compact initial={{ categoryName: c.categoryName, categoryDescription: c.categoryDescription }} /></Editor>
          </td>
        </tr>)}</tbody>
      </table></div>}
      <h3 className="sub-head">New category</h3>
      <ResourceForm endpoint="/api/admin/categories" fields={categoryFields} submitLabel="CREATE CATEGORY" resetOnSuccess compact />
    </Panel>
  </>;
}
