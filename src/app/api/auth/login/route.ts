import { db } from "@/lib/db";
import { ApiError, handler, json, limit, parseJson } from "@/lib/api";
import { createSession, isStaff, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

// Constant-cost dummy hash so unknown emails take as long as wrong passwords.
const DUMMY_HASH = "$2b$12$3FQap4T8LAUg6/xeAfXXUu6mI4y/1rvFhcwx0mdrtzZgjsRcvIWxG";

export const POST = handler(async (req) => {
  limit(req, "login", 10, 10 * 60_000);
  const { email, password } = await parseJson(req, loginSchema);
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, "Incorrect email or password");
  if (!user.isActive) throw new ApiError(403, "This account has been disabled. Please contact support.");
  await createSession(user.id);
  return json({ user: { id: user.id, name: user.name, email: user.email, isStaff: isStaff({ ...user }) } });
});
