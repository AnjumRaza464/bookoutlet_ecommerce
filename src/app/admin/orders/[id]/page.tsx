import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { OrderEvents } from "@/components/common/order-timeline";
import { OrderAdminControls, PaymentReview } from "./order-controls";

export const metadata = { title: "Order" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, include: { verifiedBy: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <AdminHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${order.createdAt.toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}`}
        actions={
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Items">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">
                      <Link href={`/admin/books/${i.bookId}`} className="font-medium hover:text-brand-brown">{i.title}</Link>
                      <span className="block text-xs text-muted-foreground">{i.sku}</span>
                    </td>
                    <td className="py-2 text-right">{i.quantity} × {formatPKR(i.unitPrice)}</td>
                    <td className="py-2 text-right font-semibold">{formatPKR(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 ml-auto max-w-xs space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between"><dt>Discount ({order.couponCode})</dt><dd>− {formatPKR(order.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPKR(order.shippingFee)}</dd></div>
              <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatPKR(order.total)}</dd></div>
            </dl>
          </Panel>
          <Panel title={`Payments · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`}>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {order.paymentMethod === "COD" ? "Cash on Delivery — mark as paid once the courier remits the cash." : "No payment attempts yet."}
              </p>
            ) : (
              <ul className="space-y-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{PAYMENT_METHOD_LABELS[p.method]} · {formatPKR(p.amount)}</span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      {p.gatewayOrderId && <div>Gateway order ID: <span className="text-foreground">{p.gatewayOrderId}</span></div>}
                      {p.transactionId && <div>Easypaisa TID: <span className="text-foreground">{p.transactionId}</span></div>}
                      {p.mobileAccount && <div>Mobile account: <span className="text-foreground">{p.mobileAccount}</span></div>}
                      {p.manualTid && <div>Customer TID: <span className="font-semibold text-foreground">{p.manualTid}</span></div>}
                      {p.manualSender && <div>Sent from: <span className="text-foreground">{p.manualSender}</span></div>}
                      {p.responseCode && <div>Response: <span className="text-foreground">{p.responseCode} {p.responseDesc}</span></div>}
                      {!p.responseCode && p.responseDesc && <div>Note: <span className="text-foreground">{p.responseDesc}</span></div>}
                      <div>Created: {p.createdAt.toLocaleString("en-PK")}</div>
                      {p.verifiedAt && <div>Verified: {p.verifiedAt.toLocaleString("en-PK")} {p.verifiedBy && `by ${p.verifiedBy.name}`}</div>}
                    </dl>
                    <PaymentReview paymentId={p.id} method={p.method} status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="History">
            <OrderEvents events={order.events} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Fulfilment">
            <OrderAdminControls
              order={{ id: order.id, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, courier: order.courier ?? "", trackingNumber: order.trackingNumber ?? "" }}
            />
          </Panel>
          <Panel title="Customer">
            <div className="text-sm">
              <p className="font-semibold">{order.fullName}</p>
              <p className="text-muted-foreground">{order.email}</p>
              <p className="text-muted-foreground"><a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a></p>
              <p className="mt-3 font-semibold">Delivery address</p>
              <p className="text-muted-foreground">{order.line1}{order.line2 ? `, ${order.line2}` : ""}</p>
              <p className="text-muted-foreground">{order.city}, {order.province} {order.postalCode}</p>
              {order.notes && <p className="mt-3 rounded-md bg-brand-cream p-2"><strong>Note:</strong> {order.notes}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Account: {order.user.name} · {order.user._count.orders} order(s)</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
