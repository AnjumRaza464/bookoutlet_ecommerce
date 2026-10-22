import "server-only";
import { db } from "./db";

export type Range = { from: Date; to: Date };

/** Parses yyyy-mm-dd range params (inclusive), defaulting to the last 30 days. */
export function parseRange(fromStr?: string, toStr?: string): Range {
  const valid = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00+05:00`) : null);
  const to = valid(toStr) ?? new Date(new Date().toISOString().slice(0, 10) + "T00:00:00+05:00");
  const from = valid(fromStr) ?? new Date(to.getTime() - 29 * 86_400_000);
  const toEnd = new Date(to.getTime() + 86_400_000 - 1);
  return from <= toEnd ? { from, to: toEnd } : { from: to, to: new Date(from.getTime() + 86_400_000 - 1) };
}

/** Pakistan Standard Time (UTC+5) calendar day key. */
export function pkDay(d: Date) {
  return new Date(d.getTime() + 5 * 3_600_000).toISOString().slice(0, 10);
}

export async function salesReport({ from, to }: Range) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      subtotal: true,
      discountTotal: true,
      shippingFee: true,
      total: true,
      city: true,
      province: true,
      fullName: true,
      items: { select: { bookId: true, title: true, quantity: true, lineTotal: true, book: { select: { classLevel: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  const live = orders.filter((o) => o.status !== "CANCELLED");

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) byDay.set(pkDay(new Date(t)), { revenue: 0, orders: 0 });
  for (const o of live) {
    const d = byDay.get(pkDay(o.createdAt)) ?? { revenue: 0, orders: 0 };
    d.revenue += o.total;
    d.orders += 1;
    byDay.set(pkDay(o.createdAt), d);
  }

  const byMethod = new Map<string, { revenue: number; orders: number }>();
  const byClass = new Map<number, { revenue: number; units: number }>();
  const byProvince = new Map<string, number>();
  const books = new Map<string, { title: string; units: number; revenue: number }>();
  for (const o of live) {
    const m = byMethod.get(o.paymentMethod) ?? { revenue: 0, orders: 0 };
    m.revenue += o.total;
    m.orders += 1;
    byMethod.set(o.paymentMethod, m);
    byProvince.set(o.province, (byProvince.get(o.province) ?? 0) + o.total);
    for (const i of o.items) {
      const b = books.get(i.bookId) ?? { title: i.title, units: 0, revenue: 0 };
      b.units += i.quantity;
      b.revenue += i.lineTotal;
      books.set(i.bookId, b);
      const c = byClass.get(i.book.classLevel) ?? { revenue: 0, units: 0 };
      c.revenue += i.lineTotal;
      c.units += i.quantity;
      byClass.set(i.book.classLevel, c);
    }
  }

  const gross = live.reduce((s, o) => s + o.total, 0);
  const collected = live.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.total, 0);
  const discounts = live.reduce((s, o) => s + o.discountTotal, 0);
  const units = live.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);

  return {
    orders,
    totals: {
      gross,
      collected,
      discounts,
      orders: live.length,
      cancelled: orders.length - live.length,
      units,
      aov: live.length ? Math.round(gross / live.length) : 0,
    },
    byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    byMethod: [...byMethod.entries()].map(([method, v]) => ({ method, ...v })),
    byClass: [...byClass.entries()].sort((a, b) => a[0] - b[0]).map(([classLevel, v]) => ({ classLevel, ...v })),
    byProvince: [...byProvince.entries()].sort((a, b) => b[1] - a[1]).map(([province, revenue]) => ({ province, revenue })),
    topBooks: [...books.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  };
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = v === null || v === undefined ? "" : String(v);
          // Neutralise spreadsheet formula injection.
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}
