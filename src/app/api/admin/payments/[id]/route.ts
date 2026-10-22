import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { reviewManualPayment, verifyEasypaisaPayment } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("verify") }),
]);

/** approve/reject a manual transfer, or re-run Easypaisa server-side verification. */
export const POST = handler<Ctx>(async (req, { params }) => {
  const staff = await requireApiStaff();
  const { id } = await params;
  const { action } = await parseJson(req, schema);
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (action === "verify") {
    if (payment.method !== "EASYPAISA") throw new ApiError(409, "Only online Easypaisa payments can be verified with the gateway");
    return json(await verifyEasypaisaPayment(id));
  }
  await reviewManualPayment(id, action === "approve", staff.id);
  return json({ ok: true });
});
