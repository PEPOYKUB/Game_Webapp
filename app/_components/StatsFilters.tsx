"use client";

import { useState } from "react";
import type { getFilterOptions, StatsFilters as Filters } from "@/lib/stats";

type Choice = { value: string; label: string };

function FilterDropdown({ label, name, value, choices }: { label: string; name: string; value: string; choices: Choice[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const selectedLabel = choices.find((choice) => choice.value === selected)?.label ?? choices[0]?.label ?? "Select";

  return <label className="filter-dropdown-field">
    {label}
    <span className="filter-dropdown">
      <select className="filter-dropdown-value" name={name} value={selected} onChange={(event) => setSelected(event.target.value)} tabIndex={-1} aria-hidden="true">
        {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
      </select>
      <button className="filter-dropdown-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
        <span>{selectedLabel}</span><span className="filter-dropdown-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && <span className="filter-dropdown-menu" role="listbox" aria-label={label}>
        {choices.map((choice) => <button className="filter-dropdown-option" type="button" role="option" aria-selected={selected === choice.value} key={choice.value} onClick={() => { setSelected(choice.value); setOpen(false); }}>
          {choice.label}
        </button>)}
      </span>}
    </span>
  </label>;
}

// Keep the original GET form and field names; the custom controls only replace native popup rendering.
export function StatsFilters({ options, filters, action }: { options: Awaited<ReturnType<typeof getFilterOptions>>; filters: Filters; action: string }) {
  const roomChoices = [{ value: "", label: "All rooms" }, ...options.rooms.map((room) => ({ value: String(room.roomId), label: `${room.roomCode} — ${room.roomName}` }))];
  const facultyChoices = [{ value: "", label: "All faculties" }, ...options.faculties.map((faculty) => ({ value: String(faculty.facultyId), label: `${faculty.facultyCode} — ${faculty.facultyNameEn}` }))];
  const yearChoices = [{ value: "", label: "All years" }, ...options.yearLevels.map((year) => ({ value: String(year), label: `Year ${year}` }))];

  return <form className="filter-bar" action={action} method="get">
    <FilterDropdown label="ROOM" name="roomId" value={String(filters.roomId ?? "")} choices={roomChoices} />
    <FilterDropdown label="FACULTY" name="facultyId" value={String(filters.facultyId ?? "")} choices={facultyChoices} />
    <FilterDropdown label="YEAR" name="yearLevel" value={String(filters.yearLevel ?? "")} choices={yearChoices} />
    <button>APPLY</button>
    <a href={action}>RESET</a>
  </form>;
}
