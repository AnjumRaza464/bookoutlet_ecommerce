import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiUser } from "@/lib/api";

const schema = z.object({ bookId: z.string().min(1).max(40) });

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const { bookId } = await parseJson(req, schema);
  const book = await db.book.findFirst({ where: { id: bookId, isActive: true }, select: { id: true } });
  if (!book) throw new ApiError(404, "Book not found");
  await db.wishlistItem.upsert({
    where: { userId_bookId: { userId: user.id, bookId } },
    update: {},
    create: { userId: user.id, bookId },
  });
  return json({ ok: true }, 201);
});
