import { notFound } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { listTaxonomy, TAXONOMIES, type TaxonomyKind } from "@/lib/taxonomy";
import { TaxonomyManager } from "./taxonomy-manager";

type Props = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: Props) {
  const { kind } = await params;
  return { title: TAXONOMIES[kind as TaxonomyKind]?.label ?? "Taxonomy" };
}

export default async function TaxonomyPage({ params }: Props) {
  const { kind } = await params;
  if (!(kind in TAXONOMIES)) notFound();
  const k = kind as TaxonomyKind;
  const rows = await listTaxonomy(k);
  const meta = TAXONOMIES[k];
  return (
    <>
      <AdminHeader title={meta.label} description={`Manage ${meta.label.toLowerCase()} used to organise and filter the catalogue.`} />
      <Panel>
        <TaxonomyManager
          kind={k}
          singular={meta.singular}
          fields={[...meta.fields]}
          rows={rows.map((row) => {
            const r = row as typeof row & { description?: string | null; province?: string | null; website?: string | null; sortOrder?: number };
            return {
              id: r.id,
              name: r.name,
              slug: r.slug,
              count: r._count.books,
              description: r.description ?? "",
              province: r.province ?? "",
              website: r.website ?? "",
              sortOrder: r.sortOrder ?? 0,
            };
          })}
        />
      </Panel>
    </>
  );
}
