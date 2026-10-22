"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { PROVINCES } from "@/lib/constants";
import { adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";

type Row = { id: string; name: string; slug: string; count: number; description: string; province: string; website: string; sortOrder: number };
type Field = "description" | "sortOrder" | "province" | "website";

const EMPTY = { name: "", slug: "", description: "", province: "", website: "", sortOrder: 0 };

export function TaxonomyManager({ kind, singular, fields, rows }: { kind: string; singular: string; fields: Field[]; rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [v, setV] = useState(EMPTY);
  const [pending, setPending] = useState<string | null>(null);

  function startEdit(r: Row) {
    setEditing(r.id);
    setV({ name: r.name, slug: r.slug, description: r.description, province: r.province, website: r.website, sortOrder: r.sortOrder });
  }

  function reset() {
    setEditing(null);
    setV(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending("save");
    try {
      const body = { name: v.name, slug: v.slug, ...Object.fromEntries(fields.map((f) => [f, v[f]])) };
      if (editing) await api(`/api/admin/taxonomy/${kind}/${editing}`, { method: "PATCH", body });
      else await api(`/api/admin/taxonomy/${kind}`, { body });
      toast.success(`${singular} saved`);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPending(null);
    }
  }

  async function remove(r: Row) {
    setPending(r.id);
    try {
      await api(`/api/admin/taxonomy/${kind}/${r.id}`, { method: "DELETE" });
      toast.success(`${singular} deleted`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Slug</th>
              {fields.includes("province") && <th className="pb-2">Province</th>}
              <th className="pb-2">Books</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className={editing === r.id ? "bg-brand-cream" : undefined}>
                <td className="py-2 font-medium">{r.name}</td>
                <td className="py-2 text-muted-foreground">{r.slug}</td>
                {fields.includes("province") && <td className="py-2">{r.province}</td>}
                <td className="py-2">{r.count}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <button type="button" onClick={() => startEdit(r)} aria-label={`Edit ${r.name}`} className="inline-grid size-8 place-items-center rounded-md border border-input hover:bg-muted">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    disabled={pending === r.id || r.count > 0}
                    title={r.count > 0 ? "In use by books" : "Delete"}
                    aria-label={`Delete ${r.name}`}
                    className="ml-1 inline-grid size-8 place-items-center rounded-md border border-input text-destructive hover:bg-red-50 disabled:opacity-30"
                  >
                    {pending === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={save} className="space-y-3 rounded-lg border border-border p-4 text-sm">
        <h2 className="font-bold">{editing ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</h2>
        <div className="space-y-1">
          <label htmlFor="t-name" className="font-medium">Name</label>
          <input id="t-name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={`${adminInput} w-full`} />
        </div>
        <div className="space-y-1">
          <label htmlFor="t-slug" className="font-medium">Slug (optional)</label>
          <input id="t-slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="auto-generated" className={`${adminInput} w-full`} />
        </div>
        {fields.includes("description") && (
          <div className="space-y-1">
            <label htmlFor="t-desc" className="font-medium">Description</label>
            <textarea id="t-desc" rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className={`${adminInput} h-auto w-full py-2`} />
          </div>
        )}
        {fields.includes("sortOrder") && (
          <div className="space-y-1">
            <label htmlFor="t-sort" className="font-medium">Sort order</label>
            <input id="t-sort" type="number" min={0} value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) || 0 })} className={`${adminInput} w-full`} />
          </div>
        )}
        {fields.includes("province") && (
          <div className="space-y-1">
            <label htmlFor="t-prov" className="font-medium">Province</label>
            <select id="t-prov" value={v.province} onChange={(e) => setV({ ...v, province: e.target.value })} className={`${adminInput} w-full`}>
              <option value="">—</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}
        {fields.includes("website") && (
          <div className="space-y-1">
            <label htmlFor="t-web" className="font-medium">Website</label>
            <input id="t-web" type="url" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} placeholder="https://" className={`${adminInput} w-full`} />
          </div>
        )}
        <div className="flex gap-2">
          <button disabled={pending === "save"} className={adminBtn}>
            {pending === "save" && <Loader2 className="size-4 animate-spin" />} {editing ? "Save" : "Add"}
          </button>
          {editing && <button type="button" onClick={reset} className={adminBtnOutline}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
