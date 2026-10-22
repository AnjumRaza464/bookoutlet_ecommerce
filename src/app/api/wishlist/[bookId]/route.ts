import { db } from "@/lib/db";
import { handler, json, requireApiUser } from "@/lib/api";

type Ctx = { params: Promise<{ bookId: string }> };

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const { bookId } = await params;
  await db.wishlistItem.deleteMany({ where: { userId: user.id, bookId } });
  return json({ ok: true });
});
