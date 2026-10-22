import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { isEasypaisaConfigured } from "@/lib/easypaisa";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { OrderEvents, OrderProgress } from "@/components/common/order-timeline";
import { CancelOrderButton, PaymentPanel } from "./payment-panel";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ placed?: string }> };

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: {
      items: { include: { book: { select: { slug: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order || (order.userId !== user.id && !isStaff(user))) notFound();

  const latest = order.payments[0];
  const canCancel = order.status === "PENDING" && order.paymentStatus !== "PAID" && order.paymentStatus !== "AWAITING_VERIFICATION";

  return (
    <div className="space-y-6">
      {placed && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="font-semibold">Thank you! Your order {order.orderNumber} has been placed.</p>
            <p className="text-sm">
              {order.paymentMethod === "COD"
                ? "We'll call you to confirm and dispatch your books soon."
                : "Please complete your payment below so we can dispatch your books."}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Order {order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">Placed on {order.createdAt.toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}</p>
          </div>
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="mt-6">
          <OrderProgress status={order.status} />
        </div>
        {order.trackingNumber && (
          <p className="mt-4 rounded-lg bg-brand-cream px-4 py-3 text-sm">
            Shipped with <strong>{order.courier ?? "courier"}</strong> · Tracking number <strong>{order.trackingNumber}</strong>
          </p>
        )}
      </section>

      <PaymentPanel
        order={{
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          phone: order.phone,
        }}
        latestPayment={latest ? { status: latest.status, responseDesc: latest.responseDesc, manualTid: latest.manualTid } : null}
        easypaisaOnline={isEasypaisaConfigured()}
        manualAccount={{
          number: process.env.MANUAL_EASYPAISA_ACCOUNT_NUMBER || "Not configured",
          title: process.env.MANUAL_EASYPAISA_ACCOUNT_TITLE || "BNB Book Outlet",
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold">Items</h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <span>
                  <Link href={`/books/${i.book.slug}`} className="font-medium hover:text-brand-brown">{i.title}</Link>
                  <span className="block text-muted-foreground">
                    {i.quantity} × {formatPKR(i.unitPrice)}
                  </span>
                </span>
                <span className="font-semibold">{formatPKR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between"><dt className="text-muted-foreground">Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>− {formatPKR(order.discountTotal)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="text-brand-brown">{formatPKR(order.total)}</dd></div>
          </dl>
        </section>
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 text-sm">
            <h3 className="text-lg font-bold">Delivery to</h3>
            <p className="mt-2 font-semibold">{order.fullName}</p>
            <p className="text-muted-foreground">{order.line1}{order.line2 ? `, ${order.line2}` : ""}</p>
            <p className="text-muted-foreground">{order.city}, {order.province} {order.postalCode}</p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="mt-3 text-xs text-muted-foreground">Payment: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-bold">History</h3>
            <OrderEvents events={order.events} />
          </section>
          {canCancel && <CancelOrderButton orderNumber={order.orderNumber} />}
        </div>
      </div>
    </div>
  );
}
