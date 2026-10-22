import { db } from "@/lib/db";
import { handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { bookSchema } from "@/lib/validation";
import { bookData } from "@/lib/admin-data";

export const POST = handler(async (req) => {
  await requireApiStaff();
  const input = await parseJson(req, bookSchema);
  const book = await db.book.create({ data: bookData(input) });
  return json({ book }, 201);
});
