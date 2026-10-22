import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson, requireApiUser } from "@/lib/api";
import { createOrder } from "@/lib/orders";
import { checkoutSchema } from "@/lib/validation";
import { isEasypaisaConfigured } from "@/lib/easypaisa";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  limit(req, `checkout:${user.id}`, 10);
  const data = await parseJson(req, checkoutSchema);

  if (data.paymentMethod === "EASYPAISA" && !isEasypaisaConfigured()) {
    throw new ApiError(409, "Online Easypaisa payment is currently unavailable. Please choose manual Easypaisa transfer or Cash on Delivery.");
  }

  const order = await createOrder({
    userId: user.id,
    email: user.email,
    items: data.items,
    couponCode: data.couponCode || null,
    paymentMethod: data.paymentMethod,
    notes: data.notes || null,
    address: data.address,
  });

  if (data.saveAddress) {
    const a = data.address;
    const same = await db.address.findFirst({ where: { userId: user.id, line1: a.line1, city: a.city, phone: a.phone } });
    if (!same) {
      const count = await db.address.count({ where: { userId: user.id } });
      await db.address.create({
        data: {
          userId: user.id,
          fullName: a.fullName,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2 || null,
          city: a.city,
          province: a.province,
          postalCode: a.postalCode || null,
          isDefault: count === 0,
        },
      });
    }
  }

  return json({ orderNumber: order.orderNumber, total: order.total, paymentMethod: order.paymentMethod }, 201);
});
