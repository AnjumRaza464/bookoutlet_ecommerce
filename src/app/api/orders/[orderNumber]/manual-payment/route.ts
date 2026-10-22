import { handler, json, limit, parseJson, requireApiUser } from "@/lib/api";
import { submitManualPayment } from "@/lib/orders";
import { getAccessibleOrder } from "@/lib/order-access";
import { manualPaymentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ orderNumber: string }> };

/** Customer submits the TID of a manual Easypaisa transfer; staff verify it before the order is marked paid. */
export const POST = handler<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  limit(req, `manual-pay:${user.id}`, 5);
  const order = await getAccessibleOrder((await params).orderNumber, user);
  const { transactionId, senderNumber } = await parseJson(req, manualPaymentSchema);
  await submitManualPayment(order.id, transactionId.toUpperCase(), senderNumber);
  return json({ ok: true, message: "Thanks! We'll verify your transfer and confirm your order shortly." });
});
