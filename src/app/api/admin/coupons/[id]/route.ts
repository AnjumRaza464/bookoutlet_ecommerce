import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseJson, requireApiStaff } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireApiStaff();
  const { id } = await params;
  const { isActive } = await parseJson(req, z.object({ isActive: z.boolean() }));
  const coupon = await db.coupon.update({ where: { id }, data: { isActive } });
  return json({ coupon });
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireApiStaff();
  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  return json({ ok: true });
});
