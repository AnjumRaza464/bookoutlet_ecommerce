import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { primaryBtn } from "@/components/common/field";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-bold">My orders</h2>
      {orders.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <Link href="/books" className={`${primaryBtn} mt-4`}>Browse books</Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 pr-4">
                    <Link href={`/account/orders/${o.orderNumber}`} className="font-semibold text-brand-brown hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{o.createdAt.toLocaleDateString("en-PK")}</td>
                  <td className="py-3 pr-4">{o._count.items}</td>
                  <td className="py-3 pr-4">
                    <span className="block text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </td>
                  <td className="py-3 pr-4">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="py-3 text-right font-semibold">{formatPKR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
