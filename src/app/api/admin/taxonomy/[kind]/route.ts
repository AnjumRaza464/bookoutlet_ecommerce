import { handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { assertKind, createTaxonomy } from "@/lib/taxonomy";
import { taxonomySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ kind: string }> };

export const POST = handler<Ctx>(async (req, { params }) => {
  await requireApiStaff();
  const kind = assertKind((await params).kind);
  const input = await parseJson(req, taxonomySchema);
  const item = await createTaxonomy(kind, input);
  return json({ item }, 201);
});
