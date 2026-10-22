import { ApiError, handler, json, requireApiUser } from "@/lib/api";
import { cancelOrder } from "@/lib/orders";
import { getAccessibleOrder } from "@/lib/order-access";

type Ctx = { params: Promise<{ orderNumber: string }> };

/** Customers may cancel their own order while it is still pending and unpaid. */
export const POST = handler<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const order = await getAccessibleOrder((await params).orderNumber, user);
  if (order.status !== "PENDING") throw new ApiError(409, "This order is already being processed. Please contact support to cancel.");
  if (order.paymentStatus === "PAID" || order.paymentStatus === "AWAITING_VERIFICATION") {
    throw new ApiError(409, "Paid orders can only be cancelled by our support team.");
  }
  await cancelOrder(order.id, "Cancelled by customer");
  return json({ ok: true });
});
