import { db } from "@/lib/db";
import { handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { couponSchema } from "@/lib/validation";
import { couponData } from "@/lib/admin-data";

export const POST = handler(async (req) => {
  await requireApiStaff();
  const input = await parseJson(req, couponSchema);
  const coupon = await db.coupon.create({ data: couponData(input) });
  return json({ coupon }, 201);
});
