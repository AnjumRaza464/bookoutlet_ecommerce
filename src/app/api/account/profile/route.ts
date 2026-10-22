import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseJson, requireApiUser } from "@/lib/api";
import { pkMobile } from "@/lib/validation";

const schema = z.object({ name: z.string().trim().min(2).max(80), phone: pkMobile });

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  const data = await parseJson(req, schema);
  await db.user.update({ where: { id: user.id }, data });
  return json({ ok: true });
});
