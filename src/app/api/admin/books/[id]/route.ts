import { db } from "@/lib/db";
import { ApiError, handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { bookPatchSchema, bookSchema } from "@/lib/validation";
import { bookData } from "@/lib/admin-data";

type Ctx = { params: Promise<{ id: string }> };

async function existing(id: string) {
  const book = await db.book.findUnique({ where: { id }, select: { id: true } });
  if (!book) throw new ApiError(404, "Book not found");
  return book;
}

/** Full update from the book editor. */
export const PUT = handler<Ctx>(async (req, { params }) => {
  await requireApiStaff();
  const { id } = await params;
  await existing(id);
  const input = await parseJson(req, bookSchema);
  const book = await db.book.update({ where: { id }, data: bookData(input) });
  return json({ book });
});

/** Quick edits: price, discount, stock, visibility. */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireApiStaff();
  const { id } = await params;
  await existing(id);
  const data = await parseJson(req, bookPatchSchema);
  const book = await db.book.update({ where: { id }, data });
  return json({ book });
});

/** Deletes a book; books that appear in orders are archived (hidden) instead to keep order history intact. */
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireApiStaff();
  const { id } = await params;
  await existing(id);
  const used = await db.orderItem.count({ where: { bookId: id } });
  if (used > 0) {
    await db.book.update({ where: { id }, data: { isActive: false, isFeatured: false } });
    return json({ archived: true, message: "Book has order history, so it was hidden from the store instead of deleted." });
  }
  await db.book.delete({ where: { id } });
  return json({ deleted: true });
});
