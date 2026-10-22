import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, json } from "@/lib/api";
import { verifyEasypaisaPayment } from "@/lib/orders";

/**
 * Easypaisa IPN (instant payment notification) listener.
 * Register this URL with Easypaisa as: https://<your-domain>/api/payments/easypaisa/ipn?key=<EASYPAISA_IPN_SECRET>
 *
 * The notification body is never trusted for the payment result: it only tells us which order to
 * re-check, and the outcome always comes from a server-side inquire-transaction call.
 */
function keyOk(req: NextRequest) {
  const expected = process.env.EASYPAISA_IPN_SECRET;
  const given = req.nextUrl.searchParams.get("key") ?? "";
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function extractOrderId(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  let id = q.get("orderRefNumber") ?? q.get("orderRefNum") ?? q.get("orderId") ?? q.get("order_id");
  if (!id && req.method === "POST") {
    const body = await req
      .clone()
      .json()
      .catch(async () => Object.fromEntries(new URLSearchParams(await req.text().catch(() => ""))));
    id = body?.orderRefNumber ?? body?.orderRefNum ?? body?.orderId ?? body?.order_id ?? null;
  }
  return typeof id === "string" ? id.slice(0, 40) : null;
}

const ipn = handler(
  async (req) => {
    if (!keyOk(req)) return json({ error: "Unauthorized" }, 401);
    const gatewayOrderId = await extractOrderId(req);
    if (!gatewayOrderId) return json({ error: "orderId missing" }, 400);
    const payment = await db.payment.findUnique({ where: { gatewayOrderId } });
    if (!payment) return json({ error: "Unknown order" }, 404);
    const result = await verifyEasypaisaPayment(payment.id);
    return json({ received: true, outcome: result.outcome });
  },
  { skipOriginCheck: true },
);

export const GET = ipn;
export const POST = ipn;
