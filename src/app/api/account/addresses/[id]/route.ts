import { db } from "@/lib/db";
import { ApiError, handler, json, requireApiUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) throw new ApiError(404, "Address not found");
  return address;
}

/** Make this the default address. */
export const PATCH = handler<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const address = await owned((await params).id, user.id);
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: address.id }, data: { isDefault: true } }),
  ]);
  return json({ ok: true });
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const address = await owned((await params).id, user.id);
  await db.address.delete({ where: { id: address.id } });
  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return json({ ok: true });
});
