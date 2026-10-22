import Link from "next/link";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { AdminHeader, Panel, StatCard, adminBtnOutline } from "@/components/admin/ui";
import { BookQuickTable } from "@/components/admin/book-quick-row";

export const metadata = { title: "Inventory" };

type Props = { searchParams: Promise<{ view?: string }> };

export default async function InventoryPage({ searchParams }: Props) {
  const { view = "low" } = await searchParams;
  const [lowIds, outCount, totals] = await Promise.all([
    db.$queryRaw<{ id: string }[]>`SELECT id FROM "Book" WHERE "isActive" = true AND stock > 0 AND stock <= "lowStockAlert"`,
    db.book.count({ where: { isActive: true, stock: 0 } }),
    db.$queryRaw<{ units: bigint | null; value: bigint | null }[]>`SELECT SUM(stock) AS units, SUM(stock * price) AS value FROM "Book" WHERE "isActive" = true`,
  ]);
  const where =
    view === "out" ? { isActive: true, stock: 0 } : view === "all" ? {} : { id: { in: lowIds.map((r) => r.id) } };
  const books = await db.book.findMany({
    where,
    include: { category: { select: { name: true } }, board: { select: { name: true } } },
    orderBy: [{ stock: "asc" }, { title: "asc" }],
    take: 200,
  });

  const tabs = [
    { id: "low", label: `Low stock (${lowIds.length})` },
    { id: "out", label: `Out of stock (${outCount})` },
    { id: "all", label: "All books" },
  ];

  return (
    <>
      <AdminHeader title="Inventory" description="Restock and adjust quantities. Stock is reserved automatically when orders are placed and returned when they are cancelled." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Units in stock" value={Number(totals[0]?.units ?? 0).toLocaleString("en-PK")} />
        <StatCard label="Stock value (retail)" value={formatPKR(Number(totals[0]?.value ?? 0))} />
        <StatCard label="Low stock" value={lowIds.length} tone={lowIds.length ? "warn" : "default"} />
        <StatCard label="Out of stock" value={outCount} tone={outCount ? "warn" : "default"} />
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link key={t.id} href={`/admin/inventory?view=${t.id}`} className={view === t.id ? "inline-flex h-9 items-center rounded-md bg-brand-brown px-4 text-sm font-semibold text-brand-cream" : adminBtnOutline}>
              {t.label}
            </Link>
          ))}
        </div>
        <BookQuickTable
          books={books.map((b) => ({
            id: b.id,
            title: b.title,
            sku: b.sku,
            classLevel: b.classLevel,
            price: b.price,
            discountPercent: b.discountPercent,
            stock: b.stock,
            lowStockAlert: b.lowStockAlert,
            isActive: b.isActive,
            isFeatured: b.isFeatured,
            category: b.category.name,
            board: b.board.name,
          }))}
        />
      </Panel>
    </>
  );
}
