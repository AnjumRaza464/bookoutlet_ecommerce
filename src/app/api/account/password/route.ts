import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson, requireApiUser } from "@/lib/api";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

const schema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: registerSchema.shape.password });

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  limit(req, `pw:${user.id}`, 5, 10 * 60_000);
  const { currentPassword, newPassword } = await parseJson(req, schema);
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(currentPassword, row.passwordHash))) {
    throw new ApiError(400, "Current password is incorrect", { currentPassword: "Incorrect password" });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  // Sign out every other session, then issue a fresh one for this device.
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return json({ ok: true });
});
