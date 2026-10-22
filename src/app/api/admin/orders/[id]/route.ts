import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { cancelOrder } from "@/lib/orders";
import { orderUpdateSchema } from "@/lib/validation";
import type { OrderStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const PATCH = handler<Ctx>(async (req, { params }) => {
  const staff = await requireApiStaff();
  const { id } = await params;
  const input = await parseJson(req, orderUpdateSchema);
  const order = await db.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found");

  if (input.status === "CANCELLED") {
    await cancelOrder(id, input.note || `Cancelled by ${staff.name}`);
    return json({ ok: true });
  }

  if (input.status && input.status !== order.status && !NEXT[order.status].includes(input.status)) {
    throw new ApiError(409, `Cannot move an order from ${order.status} to ${input.status}`);
  }

  if (input.paymentStatus && input.paymentStatus !== order.paymentStatus) {
    // Online/manual Easypaisa payments are marked paid only through verification.
    if (input.paymentStatus === "PAID" && order.paymentMethod !== "COD") {
      throw new ApiError(409, "Easypaisa payments are marked paid only after verification (see Payments panel)");
    }
    if (input.paymentStatus === "REFUNDED" && order.paymentStatus !== "PAID") throw new ApiError(409, "Only paid orders can be refunded");
    if (!["PAID", "REFUNDED", "UNPAID"].includes(input.paymentStatus)) throw new ApiError(409, "That payment status cannot be set manually");
  }

  const status = input.status ?? order.status;
  const notes: string[] = [];
  if (input.status && input.status !== order.status) notes.push(`Status changed to ${input.status.toLowerCase()} by ${staff.name}`);
  if (input.paymentStatus && input.paymentStatus !== order.paymentStatus) notes.push(`Payment marked ${input.paymentStatus.toLowerCase()} by ${staff.name}`);
  if (input.trackingNumber && input.trackingNumber !== order.trackingNumber) notes.push(`Tracking: ${input.courier ?? order.courier ?? ""} ${input.trackingNumber}`.trim());
  if (input.note) notes.push(input.note);

  await db.order.update({
    where: { id },
    data: {
      status,
      paymentStatus: input.paymentStatus ?? undefined,
      courier: input.courier ?? undefined,
      trackingNumber: input.trackingNumber ?? undefined,
      events: notes.length ? { create: { status, note: notes.join(" · ") } } : undefined,
    },
  });
  return json({ ok: true });
});
