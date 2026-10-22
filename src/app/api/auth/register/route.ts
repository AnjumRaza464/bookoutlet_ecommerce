import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export const POST = handler(async (req) => {
  limit(req, "register", 5, 10 * 60_000);
  const data = await parseJson(req, registerSchema);
  const exists = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "An account with this email already exists", { email: "Email already registered" });
  const user = await db.user.create({
    data: { name: data.name, email: data.email, phone: data.phone, passwordHash: await hashPassword(data.password) },
    select: { id: true, name: true, email: true },
  });
  await createSession(user.id);
  return json({ user }, 201);
});
