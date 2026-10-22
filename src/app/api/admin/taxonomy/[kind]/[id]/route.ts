import { handler, json, parseJson, requireApiStaff } from "@/lib/api";
import { assertKind, deleteTaxonomy, updateTaxonomy } from "@/lib/taxonomy";
import { taxonomySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireApiStaff();
  const { kind, id } = await params;
  const input = await parseJson(req, taxonomySchema);
  const item = await updateTaxonomy(assertKind(kind), id, input);
  return json({ item });
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireApiStaff();
  const { kind, id } = await params;
  await deleteTaxonomy(assertKind(kind), id);
  return json({ ok: true });
});
