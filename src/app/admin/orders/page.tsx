import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { AdminHeader, Panel, adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";

export const metadata = { title: "Orders" };

const PER_PAGE = 25;
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.OrderWhereInput = {};
  if (sp.q) {
    where.OR = [
      { orderNumber: { contains: sp.q.toUpperCase() } },
      { fullName: { contains: sp.q, mode: "insensitive" } },
      { phone: { contains: sp.q } },
      { email: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.status && sp.status in ORDER_STATUS_LABELS) where.status = sp.status as never;
  if (sp.payment && sp.payment in PAYMENT_STATUS_LABELS) where.paymentStatus = sp.payment as never;
  if (sp.method && sp.method in PAYMENT_METHOD_LABELS) where.paymentMethod = sp.method as never;

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { _count: { select: { items: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    u.set("page", String(p));
    return `/admin/orders?${u}`;
  };

  return (
    <>
      <AdminHeader
        title="Orders"
        description={`${total} orders`}
        actions={<Link href="/admin/orders?payment=AWAITING_VERIFICATION" className={adminBtnOutline}>Payments to verify</Link>}
      />
      <Panel>
        <form action="/admin/orders" className="mb-4 flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q} placeholder="Order no., name, phone or email" aria-label="Search orders" className={`${adminInput} min-w-56 flex-1`} />
          <select name="status" defaultValue={sp.status ?? ""} aria-label="Order status" className={adminInput}>
            <option value="">Any status</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="payment" defaultValue={sp.payment ?? ""} aria-label="Payment status" className={adminInput}>
            <option value="">Any payment status</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="method" defaultValue={sp.method ?? ""} aria-label="Payment method" className={adminInput}>
            <option value="">Any method</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className={adminBtn}>Filter</button>
          <Link href="/admin/orders" className={adminBtnOutline}>Reset</Link>
        </form>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2">Payment</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-brown hover:underline">{o.orderNumber}</Link>
                      <span className="block text-xs text-muted-foreground">{o.createdAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </td>
                    <td className="py-2.5">
                      {o.fullName}
                      <span className="block text-xs text-muted-foreground">{o.phone} · {o.city}</span>
                    </td>
                    <td className="py-2.5">{o._count.items}</td>
                    <td className="py-2.5">
                      <span className="block text-xs">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span>
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </td>
                    <td className="py-2.5"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2.5 text-right font-semibold">{formatPKR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={qs(page - 1)} className={adminBtnOutline}>Previous</Link>}
              {page < pages && <Link href={qs(page + 1)} className={adminBtnOutline}>Next</Link>}
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
