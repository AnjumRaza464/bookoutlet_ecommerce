import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./api";
import { buildQuote, type CouponLike } from "./pricing";
import {
  evaluateInquiry,
  EasypaisaError,
  getEasypaisaConfig,
  initiateMaTransaction,
  inquireTransaction,
  type VerificationOutcome,
} from "./easypaisa";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";

type CartItem = { bookId: string; quantity: number };

function mergeItems(items: CartItem[]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.bookId, (map.get(i.bookId) ?? 0) + i.quantity);
  return [...map.entries()].map(([bookId, quantity]) => ({ bookId, quantity }));
}

async function loadCoupon(code: string | undefined | null, client: Prisma.TransactionClient | typeof db = db) {
  if (!code) return { coupon: null as (CouponLike & { id: string }) | null, requested: false };
  const coupon = await client.coupon.findUnique({ where: { code: code.toUpperCase() } });
  return { coupon, requested: true };
}

/** Prices a cart entirely from the database. Never trusts client-side prices. */
export async function quoteCart(items: CartItem[], couponCode?: string | null) {
  const merged = mergeItems(items);
  const books = await db.book.findMany({
    where: { id: { in: merged.map((i) => i.bookId) } },
    select: { id: true, title: true, price: true, discountPercent: true, stock: true, isActive: true, slug: true, coverImage: true },
  });
  const byId = new Map(books.map((b) => [b.id, b]));
  const lines = merged.filter((i) => byId.has(i.bookId)).map((i) => ({ book: byId.get(i.bookId)!, quantity: i.quantity }));
  const { coupon, requested } = await loadCoupon(couponCode);
  const quote = buildQuote(lines, requested ? (coupon ?? invalidCoupon) : null);
  const missing = merged.filter((i) => !byId.has(i.bookId)).map((i) => i.bookId);
  return {
    ...quote,
    lines: quote.lines.map((l) => ({ ...l, slug: byId.get(l.bookId)!.slug, coverImage: byId.get(l.bookId)!.coverImage })),
    missing,
  };
}

// Used so that an unknown code yields "Invalid coupon code" rather than being silently ignored.
const invalidCoupon: CouponLike = {
  code: "",
  type: "FIXED",
  value: 0,
  minOrder: 0,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: false,
};

export function generateOrderNumber(now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `BNB-${ymd}-${suffix}`;
}

type CreateOrderInput = {
  userId: string;
  email: string;
  items: CartItem[];
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    province: string;
    postalCode?: string | null;
  };
};

export async function createOrder(input: CreateOrderInput) {
  const merged = mergeItems(input.items);
  if (merged.length === 0) throw new ApiError(400, "Your cart is empty");

  return db.$transaction(
    async (tx) => {
      const books = await tx.book.findMany({ where: { id: { in: merged.map((i) => i.bookId) } } });
      if (books.length !== merged.length) throw new ApiError(409, "Some books in your cart are no longer available");
      const byId = new Map(books.map((b) => [b.id, b]));
      const { coupon, requested } = await loadCoupon(input.couponCode, tx);
      const quote = buildQuote(
        merged.map((i) => ({ book: byId.get(i.bookId)!, quantity: i.quantity })),
        requested ? (coupon ?? invalidCoupon) : null,
      );
      if (quote.hasErrors) {
        const bad = quote.lines.find((l) => l.error)!;
        throw new ApiError(409, `${bad.title}: ${bad.error}`);
      }
      if (quote.couponError) throw new ApiError(409, quote.couponError);

      // Reserve stock atomically; fails if another order took the last copies.
      for (const line of quote.lines) {
        const res = await tx.book.updateMany({
          where: { id: line.bookId, isActive: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (res.count !== 1) throw new ApiError(409, `${line.title} just went out of stock`);
      }

      if (coupon && quote.couponCode) {
        const res = await tx.coupon.updateMany({
          where: { id: coupon.id, ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (res.count !== 1) throw new ApiError(409, "This coupon has reached its usage limit");
      }

      let orderNumber = generateOrderNumber();
      while (await tx.order.findUnique({ where: { orderNumber }, select: { id: true } })) orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "COD" ? "UNPAID" : "PENDING",
          subtotal: quote.subtotal,
          discountTotal: quote.discountTotal,
          couponCode: quote.couponCode ?? null,
          shippingFee: quote.shippingFee,
          total: quote.total,
          email: input.email,
          fullName: input.address.fullName,
          phone: input.address.phone,
          line1: input.address.line1,
          line2: input.address.line2 || null,
          city: input.address.city,
          province: input.address.province,
          postalCode: input.address.postalCode || null,
          notes: input.notes || null,
          items: {
            create: quote.lines.map((l) => ({
              bookId: l.bookId,
              title: l.title,
              sku: byId.get(l.bookId)!.sku,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          events: { create: { status: "PENDING", note: "Order placed" } },
        },
      });
      return order;
    },
    { timeout: 20_000 },
  );
}

const CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

/** Cancels an order and returns its stock (and coupon use) to the pool. Idempotent. */
export async function cancelOrder(orderId: string, note: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "CANCELLED") return order;
    if (!CANCELLABLE.includes(order.status)) throw new ApiError(409, "Shipped or delivered orders cannot be cancelled");
    // Status guard prevents double restock under concurrent cancellation.
    const res = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: "CANCELLED" } });
    if (res.count !== 1) throw new ApiError(409, "Order was updated by someone else, please retry");
    for (const item of order.items) {
      await tx.book.update({ where: { id: item.bookId }, data: { stock: { increment: item.quantity } } });
    }
    if (order.couponCode) {
      await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { events: { create: { status: "CANCELLED", note } } },
    });
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

/** Records a verified successful payment against an order. Idempotent. */
async function markPaid(tx: Prisma.TransactionClient, orderId: string, note: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.paymentStatus === "PAID") return;
  await tx.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      events: { create: { status: order.status === "PENDING" ? "CONFIRMED" : order.status, note } },
    },
  });
}

export async function startEasypaisaPayment(orderId: string, mobileAccountNo: string) {
  const cfg = getEasypaisaConfig();
  if (!cfg) throw new ApiError(503, "Online Easypaisa payments are not configured. Please use the manual transfer option.");

  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "CANCELLED") throw new ApiError(409, "This order has been cancelled");
  if (order.paymentStatus === "PAID") throw new ApiError(409, "This order is already paid");
  if (order.paymentMethod !== "EASYPAISA") throw new ApiError(409, "This order does not use online Easypaisa payment");

  const attempt = order.payments.filter((p) => p.method === "EASYPAISA").length + 1;
  if (attempt > 5) throw new ApiError(429, "Too many payment attempts for this order. Please contact support.");
  const gatewayOrderId = attempt === 1 ? order.orderNumber : `${order.orderNumber}-${attempt}`;

  const payment = await db.payment.create({
    data: { orderId, method: "EASYPAISA", status: "PENDING", amount: order.total, gatewayOrderId, mobileAccount: mobileAccountNo },
  });

  try {
    const res = await initiateMaTransaction(cfg, {
      orderId: gatewayOrderId,
      amount: order.total,
      mobileAccountNo,
      emailAddress: order.email,
    });
    await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: res.transactionId ?? null,
        responseCode: res.responseCode ?? null,
        responseDesc: res.responseDesc ?? null,
        rawResponse: res as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    const message = err instanceof EasypaisaError ? err.message : "Easypaisa request failed";
    await db.payment.update({
      where: { id: payment.id },
      data: { responseDesc: message, rawResponse: (err as EasypaisaError).raw as Prisma.InputJsonValue | undefined },
    });
  }

  // The initiate response alone is never trusted: always confirm via inquiry.
  return verifyEasypaisaPayment(payment.id);
}

export async function verifyEasypaisaPayment(paymentId: string): Promise<{ outcome: VerificationOutcome; message: string }> {
  const cfg = getEasypaisaConfig();
  if (!cfg) throw new ApiError(503, "Online Easypaisa payments are not configured");
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.method !== "EASYPAISA" || !payment.gatewayOrderId) throw new ApiError(404, "Payment not found");
  if (payment.status === "PAID") return { outcome: "PAID", message: "Payment already confirmed" };

  let inquiry;
  try {
    inquiry = await inquireTransaction(cfg, payment.gatewayOrderId);
  } catch (err) {
    return { outcome: "PENDING", message: err instanceof Error ? err.message : "Could not verify payment yet" };
  }
  const outcome = evaluateInquiry(inquiry, { orderId: payment.gatewayOrderId, amount: payment.amount });

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: outcome === "PAID" ? "PAID" : outcome === "FAILED" ? "FAILED" : "PENDING",
        transactionId: inquiry.transactionId ?? payment.transactionId,
        responseCode: inquiry.responseCode ?? payment.responseCode,
        responseDesc: inquiry.responseDesc ?? payment.responseDesc,
        rawResponse: inquiry as Prisma.InputJsonValue,
        verifiedAt: outcome === "PAID" ? new Date() : null,
      },
    });
    if (outcome === "PAID") {
      await markPaid(tx, payment.orderId, `Easypaisa payment verified (TID ${inquiry.transactionId ?? "n/a"})`);
    } else if (outcome === "FAILED") {
      await tx.order.updateMany({ where: { id: payment.orderId, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "FAILED" } });
    }
  });

  const message =
    outcome === "PAID"
      ? "Payment received. Thank you!"
      : outcome === "FAILED"
        ? "Payment was not completed. You can try again or choose another payment method."
        : "Waiting for confirmation from Easypaisa. Approve the request on your phone, then check again.";
  return { outcome, message };
}

export async function submitManualPayment(orderId: string, transactionId: string, senderNumber: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "CANCELLED") throw new ApiError(409, "This order has been cancelled");
  if (order.paymentStatus === "PAID") throw new ApiError(409, "This order is already paid");
  if (order.paymentMethod !== "EASYPAISA_MANUAL") throw new ApiError(409, "This order does not use manual transfer");
  const dup = await db.payment.findFirst({ where: { manualTid: transactionId, status: { not: "FAILED" } } });
  if (dup) throw new ApiError(409, "This transaction ID has already been submitted");

  return db.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { orderId, method: "EASYPAISA_MANUAL", status: "AWAITING_VERIFICATION" },
      data: { status: "FAILED", responseDesc: "Superseded by a newer submission" },
    });
    await tx.payment.create({
      data: {
        orderId,
        method: "EASYPAISA_MANUAL",
        status: "AWAITING_VERIFICATION",
        amount: order.total,
        manualTid: transactionId,
        manualSender: senderNumber,
      },
    });
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "AWAITING_VERIFICATION" } });
  });
}

/** Admin decision on a manually submitted transfer. */
export async function reviewManualPayment(paymentId: string, approve: boolean, adminId: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.method !== "EASYPAISA_MANUAL") throw new ApiError(404, "Payment not found");
    if (payment.status !== "AWAITING_VERIFICATION") throw new ApiError(409, "This payment has already been reviewed");
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: approve ? "PAID" : "FAILED", verifiedById: adminId, verifiedAt: new Date() },
    });
    if (approve) await markPaid(tx, payment.orderId, `Manual Easypaisa transfer verified (TID ${payment.manualTid})`);
    else
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "FAILED" },
      });
  });
}
