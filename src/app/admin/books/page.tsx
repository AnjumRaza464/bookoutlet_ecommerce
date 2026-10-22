import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getFacets } from "@/lib/catalog";
import { CLASSES } from "@/lib/constants";
import { AdminHeader, Panel, adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";
import { BookQuickTable } from "@/components/admin/book-quick-row";

export const metadata = { title: "Books" };

const PER_PAGE = 25;
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminBooksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.BookWhereInput = {};
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }, { isbn: { contains: sp.q } }];
  if (sp.class) where.classLevel = Number(sp.class);
  if (sp.category) where.categoryId = sp.category;
  if (sp.status === "active") where.isActive = true;
  if (sp.status === "hidden") where.isActive = false;
  if (sp.status === "featured") where.isFeatured = true;

  const [facets, total, books] = await Promise.all([
    getFacets(),
    db.book.count({ where }),
    db.book.findMany({
      where,
      include: { category: { select: { name: true } }, board: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    u.set("page", String(p));
    return `/admin/books?${u}`;
  };

  return (
    <>
      <AdminHeader
        title="Books"
        description={`${total} books in the catalogue. Edit price, discount and stock inline, or open a book for full details.`}
        actions={<Link href="/admin/books/new" className={adminBtn}><Plus className="size-4" /> Add book</Link>}
      />
      <Panel>
        <form className="mb-4 flex flex-wrap gap-2" action="/admin/books">
          <input name="q" defaultValue={sp.q} placeholder="Search title, SKU or ISBN" aria-label="Search books" className={`${adminInput} min-w-56 flex-1`} />
          <select name="class" defaultValue={sp.class ?? ""} aria-label="Class" className={adminInput}>
            <option value="">All classes</option>
            {CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className={adminInput}>
            <option value="">All categories</option>
            {facets.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className={adminInput}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="featured">Featured</option>
          </select>
          <button className={adminBtn}>Filter</button>
          <Link href="/admin/books" className={adminBtnOutline}>Reset</Link>
        </form>
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
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={qs(page - 1)} className={adminBtnOutline}>Previous</Link>}
              {page < pages && <Link href={qs(page + 1)} className={adminBtnOutline}>Next</Link>}
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
