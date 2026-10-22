import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiUser } from "@/lib/api";
import { getAccessibleOrder } from "@/lib/order-access";
import { isEasypaisaConfigured } from "@/lib/easypaisa";

type Ctx = { params: Promise<{ orderNumber: string }> };

const schema = z.object({ method: z.enum(["EASYPAISA", "EASYPAISA_MANUAL", "COD"]) });

/** Lets a customer switch payment method on an unpaid order (e.g. after a failed Easypaisa attempt). */
export const POST = handler<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  const order = await getAccessibleOrder((await params).orderNumber, user);
  const { method } = await parseJson(req, schema);
  if (order.status === "CANCELLED") throw new ApiError(409, "This order has been cancelled");
  if (order.paymentStatus === "PAID" || order.paymentStatus === "AWAITING_VERIFICATION") {
    throw new ApiError(409, "Payment for this order is already paid or under verification");
  }
  if (method === "EASYPAISA" && !isEasypaisaConfigured()) throw new ApiError(409, "Online Easypaisa payments are unavailable");
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: method,
      paymentStatus: method === "COD" ? "UNPAID" : "PENDING",
      events: { create: { status: order.status, note: `Payment method changed to ${method.replace("_", " ").toLowerCase()}` } },
    },
  });
  return json({ ok: true });
});
