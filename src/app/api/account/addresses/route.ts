import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiUser } from "@/lib/api";
import { addressSchema } from "@/lib/validation";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const a = await parseJson(req, addressSchema);
  const count = await db.address.count({ where: { userId: user.id } });
  if (count >= 10) throw new ApiError(409, "You can save up to 10 addresses");
  const address = await db.address.create({
    data: { ...a, line2: a.line2 || null, postalCode: a.postalCode || null, userId: user.id, isDefault: count === 0 },
  });
  return json({ address }, 201);
});
