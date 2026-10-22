import { Download } from "lucide-react";
import { formatPKR } from "@/lib/money";
import { classLabel, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { parseRange, pkDay, salesReport } from "@/lib/reports";
import { AdminHeader, BarList, Panel, StatCard, adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";

export const metadata = { title: "Sales reports" };

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const range = parseRange(sp.from, sp.to);
  const r = await salesReport(range);
  const from = pkDay(range.from);
  const to = pkDay(range.to);
  const maxDay = Math.max(1, ...r.byDay.map((d) => d.revenue));

  return (
    <>
      <AdminHeader
        title="Sales reports"
        description={`${from} to ${to} (Pakistan time). Cancelled orders are excluded from sales totals.`}
        actions={
          <a href={`/api/admin/reports/export?from=${from}&to=${to}`} className={adminBtnOutline}>
            <Download className="size-4" /> Export CSV
          </a>
        }
      />
      <form action="/admin/reports" className="mb-6 flex flex-wrap items-end gap-2 text-sm">
        <div className="space-y-1">
          <label htmlFor="r-from" className="font-medium">From</label>
          <input id="r-from" type="date" name="from" defaultValue={from} className={`${adminInput} block`} />
        </div>
        <div className="space-y-1">
          <label htmlFor="r-to" className="font-medium">To</label>
          <input id="r-to" type="date" name="to" defaultValue={to} className={`${adminInput} block`} />
        </div>
        <button className={adminBtn}>Update</button>
      </form>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard label="Gross sales" value={formatPKR(r.totals.gross)} />
        <StatCard label="Payments collected" value={formatPKR(r.totals.collected)} tone="good" />
        <StatCard label="Orders" value={r.totals.orders} hint={`${r.totals.cancelled} cancelled`} />
        <StatCard label="Avg. order value" value={formatPKR(r.totals.aov)} />
        <StatCard label="Books sold" value={r.totals.units} />
        <StatCard label="Discounts given" value={formatPKR(r.totals.discounts)} />
      </div>

      <Panel title="Daily sales" className="mt-6">
        <div className="flex h-48 items-end gap-[2px]" role="img" aria-label="Bar chart of daily sales">
          {r.byDay.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-brand-caramel transition group-hover:bg-brand-brown" style={{ height: `${Math.max(d.revenue ? 2 : 0, (d.revenue / maxDay) * 100)}%` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-brand-black px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
                {d.day}: {formatPKR(d.revenue)} · {d.orders} orders
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{r.byDay[0]?.day}</span>
          <span>{r.byDay.at(-1)?.day}</span>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top books">
          <BarList rows={r.topBooks.map((b) => ({ label: `${b.title} (${b.units})`, value: b.revenue }))} format={formatPKR} />
        </Panel>
        <Panel title="By payment method">
          <BarList rows={r.byMethod.map((m) => ({ label: `${PAYMENT_METHOD_LABELS[m.method]} (${m.orders})`, value: m.revenue }))} format={formatPKR} />
        </Panel>
        <Panel title="By class">
          <BarList rows={r.byClass.map((c) => ({ label: `${classLabel(c.classLevel)} (${c.units} books)`, value: c.revenue }))} format={formatPKR} />
        </Panel>
        <Panel title="By province">
          <BarList rows={r.byProvince.map((p) => ({ label: p.province, value: p.revenue }))} format={formatPKR} />
        </Panel>
      </div>
    </>
  );
}
