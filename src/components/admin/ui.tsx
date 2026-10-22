import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-bold text-brand-black">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "warn" | "good" }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        tone === "warn" && "border-amber-300 bg-amber-50",
        tone === "good" && "border-emerald-200 bg-emerald-50",
        tone === "default" && "border-border",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-black tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, actions, className }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-sans text-sm font-bold tracking-wide uppercase">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Minimal horizontal bar list for reports (no chart library needed). */
export function BarList({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data for this period.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-brand-caramel" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const adminInput =
  "h-9 rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramel/25";
export const adminBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand-brown px-4 text-sm font-semibold text-brand-cream hover:bg-brand-black disabled:pointer-events-none disabled:opacity-60";
export const adminBtnOutline =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-white px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60";
