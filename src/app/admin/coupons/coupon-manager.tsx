"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { formatPKR } from "@/lib/money";
import { adminBtn, adminInput } from "@/components/admin/ui";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

const EMPTY = { code: "", description: "", type: "PERCENT" as "PERCENT" | "FIXED", value: 10, minOrder: 0, maxUses: "" as number | "", startsAt: "", endsAt: "", isActive: true };

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [v, setV] = useState(EMPTY);
  const [pending, setPending] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setPending(key);
    try {
      await fn();
      toast.success(ok);
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setPending(null);
    }
  }

  const status = (c: Coupon) => {
    if (!c.isActive) return "Disabled";
    if (c.endsAt && new Date(c.endsAt).getTime() < now) return "Expired";
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return "Scheduled";
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return "Used up";
    return "Active";
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="pb-2">Code</th>
              <th className="pb-2">Discount</th>
              <th className="pb-2">Min order</th>
              <th className="pb-2">Uses</th>
              <th className="pb-2">Validity</th>
              <th className="pb-2">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="py-2">
                  <span className="font-mono font-semibold">{c.code}</span>
                  {c.description && <span className="block text-xs text-muted-foreground">{c.description}</span>}
                </td>
                <td className="py-2">{c.type === "PERCENT" ? `${c.value}%` : formatPKR(c.value)}</td>
                <td className="py-2">{c.minOrder ? formatPKR(c.minOrder) : "—"}</td>
                <td className="py-2">{c.usedCount}{c.maxUses !== null && ` / ${c.maxUses}`}</td>
                <td className="py-2 text-xs">
                  {c.startsAt ? new Date(c.startsAt).toLocaleDateString("en-PK") : "Now"} → {c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-PK") : "No end"}
                </td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status(c) === "Active" ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>{status(c)}</span>
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!!pending}
                    onClick={() => run(c.id, () => api(`/api/admin/coupons/${c.id}`, { method: "PATCH", body: { isActive: !c.isActive } }), c.isActive ? "Coupon disabled" : "Coupon enabled")}
                    className="h-8 rounded-md border border-input px-3 text-xs font-semibold hover:bg-muted"
                  >
                    {c.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={!!pending}
                    aria-label={`Delete ${c.code}`}
                    onClick={() => run(c.id, () => api(`/api/admin/coupons/${c.id}`, { method: "DELETE" }), "Coupon deleted")}
                    className="ml-1 inline-grid size-8 place-items-center rounded-md border border-input align-middle text-destructive hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">No coupons yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <form
        className="space-y-3 rounded-lg border border-border p-4 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run("create", () => api("/api/admin/coupons", { body: v }), "Coupon created");
          if (ok) setV(EMPTY);
        }}
      >
        <h2 className="font-bold">New coupon</h2>
        <div className="space-y-1">
          <label htmlFor="c-code" className="font-medium">Code</label>
          <input id="c-code" required value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} className={`${adminInput} w-full font-mono uppercase`} />
        </div>
        <div className="space-y-1">
          <label htmlFor="c-desc" className="font-medium">Description</label>
          <input id="c-desc" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className={`${adminInput} w-full`} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="c-type" className="font-medium">Type</label>
            <select id="c-type" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as "PERCENT" | "FIXED" })} className={`${adminInput} w-full`}>
              <option value="PERCENT">Percent %</option>
              <option value="FIXED">Fixed Rs.</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="c-value" className="font-medium">Value</label>
            <input id="c-value" type="number" min={1} value={v.value} onChange={(e) => setV({ ...v, value: Number(e.target.value) || 0 })} className={`${adminInput} w-full`} />
          </div>
          <div className="space-y-1">
            <label htmlFor="c-min" className="font-medium">Min order (Rs.)</label>
            <input id="c-min" type="number" min={0} value={v.minOrder} onChange={(e) => setV({ ...v, minOrder: Number(e.target.value) || 0 })} className={`${adminInput} w-full`} />
          </div>
          <div className="space-y-1">
            <label htmlFor="c-max" className="font-medium">Max uses</label>
            <input id="c-max" type="number" min={1} placeholder="Unlimited" value={v.maxUses} onChange={(e) => setV({ ...v, maxUses: e.target.value === "" ? "" : Number(e.target.value) })} className={`${adminInput} w-full`} />
          </div>
          <div className="space-y-1">
            <label htmlFor="c-start" className="font-medium">Starts</label>
            <input id="c-start" type="date" value={v.startsAt} onChange={(e) => setV({ ...v, startsAt: e.target.value })} className={`${adminInput} w-full`} />
          </div>
          <div className="space-y-1">
            <label htmlFor="c-end" className="font-medium">Ends</label>
            <input id="c-end" type="date" value={v.endsAt} onChange={(e) => setV({ ...v, endsAt: e.target.value })} className={`${adminInput} w-full`} />
          </div>
        </div>
        <button disabled={pending === "create"} className={`${adminBtn} w-full`}>
          {pending === "create" && <Loader2 className="size-4 animate-spin" />} Create coupon
        </button>
      </form>
    </div>
  );
}
