"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "multi" | "password";
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  wide?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
};
type Initial = Record<string, string | number | boolean | null | undefined | string[]>;

/**
 * Generic admin create/edit form. Sends JSON to an /api/admin endpoint; the server re-validates every
 * field and checks the ADMIN role, so nothing here is trusted. Refreshes the server-rendered page on success.
 */
export function ResourceForm({ endpoint, method = "POST", fields, initial = {}, submitLabel = "SAVE", resetOnSuccess = false, compact = false }: { endpoint: string; method?: "POST" | "PATCH" | "DELETE"; fields: Field[]; initial?: Initial; submitLabel?: string; resetOnSuccess?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; message?: string }>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === "checkbox") body[field.name] = data.get(field.name) === "on";
      else if (field.type === "multi") body[field.name] = data.getAll(field.name).map(Number);
      else if (field.type === "number") body[field.name] = data.get(field.name) === "" ? "" : Number(data.get(field.name));
      else body[field.name] = String(data.get(field.name) ?? "");
    }
    setState({ kind: "busy" });
    const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return setState({ kind: "error", message: result.error ?? `Request failed (${response.status})` });
    setState({ kind: "ok", message: "Saved" });
    if (resetOnSuccess) form.reset();
    router.refresh();
  }

  return <form className={compact ? "admin-form compact" : "admin-form"} onSubmit={submit}>
    {fields.map(field => {
      const value = initial[field.name];
      const text = value === null || value === undefined ? "" : String(value);
      const common = { name: field.name, required: field.required, placeholder: field.placeholder };
      let input: React.ReactNode;
      switch (field.type) {
        case "textarea": input = <textarea {...common} defaultValue={text} rows={3} maxLength={field.maxLength} />; break;
        case "number": input = <input {...common} type="number" defaultValue={text} min={field.min} max={field.max} />; break;
        case "password": input = <input {...common} type="password" autoComplete="off" defaultValue="" maxLength={field.maxLength} />; break;
        case "checkbox": input = <input name={field.name} type="checkbox" defaultChecked={Boolean(value)} />; break;
        case "select": input = <select {...common} defaultValue={text}>{!field.required && <option value="">—</option>}{field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>; break;
        case "multi": input = <span className="multi">{field.options?.map(o => <label key={o.value}><input type="checkbox" name={field.name} value={o.value} defaultChecked={Array.isArray(value) && value.includes(o.value)} />{o.label}</label>)}</span>; break;
        default: input = <input {...common} defaultValue={text} maxLength={field.maxLength} />;
      }
      const className = [field.wide ? "wide" : "", field.type === "checkbox" ? "check" : ""].join(" ").trim();
      return <label key={field.name} className={className || undefined}>
        <span>{field.label}{field.required && " *"}</span>{input}{field.help && <small>{field.help}</small>}
      </label>;
    })}
    <div className="form-actions"><button disabled={state.kind === "busy"}>{state.kind === "busy" ? "SAVING…" : submitLabel}</button>
      <span aria-live="polite" className={state.kind === "error" ? "form-error" : "form-ok"}>{state.message}</span></div>
  </form>;
}
