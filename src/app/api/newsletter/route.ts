import { db } from "@/lib/db";
import { handler, json, limit, parseJson } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";

export const POST = handler(async (req) => {
  limit(req, "newsletter", 5);
  const { email } = await parseJson(req, newsletterSchema);
  await db.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
  return json({ ok: true }, 201);
});
