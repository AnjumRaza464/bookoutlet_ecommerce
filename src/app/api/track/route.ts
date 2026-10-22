import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson } from "@/lib/api";
import { trackSchema } from "@/lib/validation";

/** Public order tracking: requires both order number and the phone number used at checkout. */
export const POST = handler(async (req) => {
  limit(req, "track", 15);
  const { orderNumber, phone } = await parseJson(req, trackSchema);
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      phone: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      total: true,
      city: true,
      courier: true,
      trackingNumber: true,
      createdAt: true,
      events: { orderBy: { createdAt: "asc" }, select: { status: true, note: true, createdAt: true } },
      _count: { select: { items: true } },
    },
  });
  if (!order || order.phone !== phone) throw new ApiError(404, "No order found with that order number and phone number");
  const { _count, ...rest } = order;
  return json({ ...rest, phone: undefined, itemCount: _count.items });
});
