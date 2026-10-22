import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson, requireApiUser } from "@/lib/api";
import { verifyEasypaisaPayment } from "@/lib/orders";
import { getAccessibleOrder } from "@/lib/order-access";

const schema = z.object({ orderNumber: z.string().min(5).max(30) });

/** Re-checks the latest Easypaisa attempt for an order via the server-side inquiry API. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  limit(req, `ep-verify:${user.id}`, 20);
  const { orderNumber } = await parseJson(req, schema);
  const order = await getAccessibleOrder(orderNumber, user);
  const payment = await db.payment.findFirst({ where: { orderId: order.id, method: "EASYPAISA" }, orderBy: { createdAt: "desc" } });
  if (!payment) throw new ApiError(404, "No Easypaisa payment attempt found for this order");
  return json(await verifyEasypaisaPayment(payment.id));
});
