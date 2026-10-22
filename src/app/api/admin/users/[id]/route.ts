import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).optional(), isActive: z.boolean().optional() });

/** Admin-only: change a user's role or enable/disable their account. */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const admin = await requireApiAdmin();
  const { id } = await params;
  const input = await parseJson(req, schema);
  if (id === admin.id) throw new ApiError(409, "You cannot change your own role or status");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  await db.user.update({ where: { id }, data: input });
  if (input.isActive === false) await db.session.deleteMany({ where: { userId: id } });
  return json({ ok: true });
});
