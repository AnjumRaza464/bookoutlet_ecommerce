import { z } from "zod";
import { handler, json, limit, parseJson, requireApiUser } from "@/lib/api";
import { startEasypaisaPayment } from "@/lib/orders";
import { getAccessibleOrder } from "@/lib/order-access";
import { pkMobile } from "@/lib/validation";

// The MA flow waits for the customer to approve the request on their phone.
export const maxDuration = 120;

const schema = z.object({ orderNumber: z.string().min(5).max(30), mobileAccountNo: pkMobile });

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  limit(req, `ep-init:${user.id}`, 5);
  const { orderNumber, mobileAccountNo } = await parseJson(req, schema);
  const order = await getAccessibleOrder(orderNumber, user);
  const result = await startEasypaisaPayment(order.id, mobileAccountNo);
  return json(result);
});
