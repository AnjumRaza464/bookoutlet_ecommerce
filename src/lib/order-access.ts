import "server-only";
import { db } from "./db";
import { ApiError } from "./api";
import { isStaff, type SessionUser } from "./auth";

/** Loads an order by number, allowing only its owner or staff. Returns 404 for others (no enumeration). */
export async function getAccessibleOrder(orderNumber: string, user: SessionUser) {
  const order = await db.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() } });
  if (!order || (order.userId !== user.id && !isStaff(user))) throw new ApiError(404, "Order not found");
  return order;
}
