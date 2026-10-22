import Link from "next/link";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { isEasypaisaConfigured } from "@/lib/easypaisa";
import { AdminHeader, Panel, StatCard } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const now = new Date();
  const startToday = new Date(new Date(now.getTime() + 5 * 3_600_000).toISOString().slice(0, 10) + "T00:00:00+05:00");
  const start30 = new Date(now.getTime() - 30 * 86_400_000);
  const live = { status: { not: "CANCELLED" as const } };

  const [today, last30, pending, awaiting, customers, recent, lowStock, outOfStock] = await Promise.all([
    db.order.aggregate({ where: { ...live, createdAt: { gte: startToday } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { ...live, createdAt: { gte: start30 } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    db.order.count({ where: { paymentStatus: "AWAITING_VERIFICATION", status: { not: "CANCELLED" } } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.$queryRaw<{ id: string; title: string; stock: number; lowStockAlert: number }[]>`
      SELECT id, title, stock, "lowStockAlert" FROM "Book"
      WHERE "isActive" = true AND stock > 0 AND stock <= "lowStockAlert" ORDER BY stock ASC LIMIT 8`,
    db.book.count({ where: { isActive: true, stock: 0 } }),
  ]);

  return (
    <>
      <AdminHeader title="Dashboard" description="Store performance at a glance." />
      {!isEasypaisaConfigured() && (
        <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Easypaisa online payments are not configured.</strong> Customers can only use manual Easypaisa transfer and Cash on Delivery.
          Add <code>EASYPAISA_STORE_ID</code>, <code>EASYPAISA_USERNAME</code>, <code>EASYPAISA_PASSWORD</code> and <code>EASYPAISA_ACCOUNT_NUM</code> to enable it.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard label="Sales today" value={formatPKR(today._sum.total ?? 0)} hint={`${today._count} orders`} />
        <StatCard label="Sales · 30 days" value={formatPKR(last30._sum.total ?? 0)} hint={`${last30._count} orders`} />
        <StatCard label="Open orders" value={pending} hint="Pending → processing" />
        <StatCard label="Payments to verify" value={awaiting} tone={awaiting ? "warn" : "default"} hint="Manual Easypaisa" />
        <StatCard label="Out of stock" value={outOfStock} tone={outOfStock ? "warn" : "default"} />
        <StatCard label="Customers" value={customers} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold text-brand-brown hover:underline">All orders</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="text-left text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-brown hover:underline">{o.orderNumber}</Link>
                        <span className="block text-xs text-muted-foreground">{o.createdAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </td>
                      <td className="py-2.5">{o.fullName}<span className="block text-xs text-muted-foreground">{o.city}</span></td>
                      <td className="py-2.5"><span className="block text-xs">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span><PaymentStatusBadge status={o.paymentStatus} /></td>
                      <td className="py-2.5"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-2.5 text-right font-semibold">{formatPKR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Low stock" actions={<Link href="/admin/inventory" className="text-sm font-semibold text-brand-brown hover:underline">Inventory</Link>}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All active books are above their low-stock threshold.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {lowStock.map((b) => (
                <li key={b.id} className="flex justify-between gap-3 py-2">
                  <Link href={`/admin/books/${b.id}`} className="line-clamp-1 hover:text-brand-brown">{b.title}</Link>
                  <span className="shrink-0 font-semibold text-amber-700">{b.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
