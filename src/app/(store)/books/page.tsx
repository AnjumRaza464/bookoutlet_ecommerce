import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { BookGrid } from "@/components/books/book-card";
import { AutoSubmitForm } from "@/components/books/filter-form";
import { catalogHref, getFacets, parseFilters, searchBooks, SORTS } from "@/lib/catalog";
import { CLASSES, classLabel } from "@/lib/constants";
import { getWishlistIds } from "@/lib/wishlist";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const facets = await getFacets();
  const parts = [
    f.classLevel && classLabel(f.classLevel),
    f.level && (f.level === "MATRIC" ? "Matric" : "Intermediate"),
    f.category && facets.categories.find((c) => c.slug === f.category)?.name,
    f.subject && facets.subjects.find((s) => s.slug === f.subject)?.name,
    f.board && facets.boards.find((b) => b.slug === f.board)?.name,
  ].filter(Boolean);
  const title = f.q ? `Search results for “${f.q}”` : parts.length ? `${parts.join(" · ")} Books` : "All Books";
  return {
    title,
    description: `Shop ${parts.join(", ") || "Matric and Intermediate"} books online at BNB Book Outlet. Prices in PKR with delivery across Pakistan.`,
    alternates: { canonical: "/books" },
    robots: f.q ? { index: false } : undefined,
  };
}

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramel/30";

export default async function BooksPage({ searchParams }: Props) {
  const params = await searchParams;
  const f = parseFilters(params);
  const [facets, result, wishlistIds] = await Promise.all([getFacets(), searchBooks(f), getWishlistIds()]);

  const chips: { label: string; key: string }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, key: "q" });
  if (f.classLevel) chips.push({ label: classLabel(f.classLevel), key: "class" });
  if (f.level) chips.push({ label: f.level === "MATRIC" ? "Matric" : "Intermediate", key: "level" });
  if (f.category) chips.push({ label: facets.categories.find((c) => c.slug === f.category)?.name ?? f.category, key: "category" });
  if (f.board) chips.push({ label: facets.boards.find((c) => c.slug === f.board)?.name ?? f.board, key: "board" });
  if (f.subject) chips.push({ label: facets.subjects.find((c) => c.slug === f.subject)?.name ?? f.subject, key: "subject" });
  if (f.publisher) chips.push({ label: facets.publishers.find((c) => c.slug === f.publisher)?.name ?? f.publisher, key: "publisher" });
  if (f.minPrice !== undefined) chips.push({ label: `Min Rs. ${f.minPrice}`, key: "min" });
  if (f.maxPrice !== undefined) chips.push({ label: `Max Rs. ${f.maxPrice}`, key: "max" });
  if (f.inStock) chips.push({ label: "In stock", key: "stock" });

  const filters = (
    <AutoSubmitForm className="space-y-5">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      <input type="hidden" name="sort" value={f.sort} />
      <div className="space-y-1.5">
        <label htmlFor="f-class" className="text-sm font-semibold">Class</label>
        <select id="f-class" name="class" defaultValue={f.classLevel ?? ""} className={selectCls}>
          <option value="">All classes</option>
          {CLASSES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-level" className="text-sm font-semibold">Level</label>
        <select id="f-level" name="level" defaultValue={f.level ?? ""} className={selectCls}>
          <option value="">Matric & Intermediate</option>
          <option value="MATRIC">Matric (9–10)</option>
          <option value="INTERMEDIATE">Intermediate (11–12)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-category" className="text-sm font-semibold">Category</label>
        <select id="f-category" name="category" defaultValue={f.category ?? ""} className={selectCls}>
          <option value="">All categories</option>
          {facets.categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-board" className="text-sm font-semibold">Board</label>
        <select id="f-board" name="board" defaultValue={f.board ?? ""} className={selectCls}>
          <option value="">All boards</option>
          {facets.boards.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-subject" className="text-sm font-semibold">Subject</label>
        <select id="f-subject" name="subject" defaultValue={f.subject ?? ""} className={selectCls}>
          <option value="">All subjects</option>
          {facets.subjects.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-publisher" className="text-sm font-semibold">Publisher</label>
        <select id="f-publisher" name="publisher" defaultValue={f.publisher ?? ""} className={selectCls}>
          <option value="">All publishers</option>
          {facets.publishers.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">Price (Rs.)</legend>
        <div className="flex items-center gap-2">
          <input type="number" name="min" min={0} placeholder="Min" defaultValue={f.minPrice} aria-label="Minimum price" className={selectCls} />
          <span className="text-muted-foreground">–</span>
          <input type="number" name="max" min={0} placeholder="Max" defaultValue={f.maxPrice} aria-label="Maximum price" className={selectCls} />
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="stock" value="1" defaultChecked={f.inStock} className="size-4 accent-[#4a2c1a]" />
        In stock only
      </label>
      <div className="flex gap-2">
        <button type="submit" className="h-10 flex-1 rounded-md bg-brand-brown text-sm font-semibold text-brand-cream hover:bg-brand-black">
          Apply filters
        </button>
        <Link href="/books" className="grid h-10 place-items-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted">
          Reset
        </Link>
      </div>
    </AutoSubmitForm>
  );

  const heading = f.q ? `Results for “${f.q}”` : f.classLevel ? `${classLabel(f.classLevel)} Books` : chips[0]?.label ? `${chips[0].label}` : "All Books";

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-brown">Home</Link> / <span className="text-foreground">Books</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black sm:text-4xl">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "book" : "books"} found
          </p>
        </div>
        <AutoSubmitForm className="flex items-center gap-2">
          {Object.entries(params).map(([k, v]) =>
            k !== "sort" && k !== "page" && typeof v === "string" ? <input key={k} type="hidden" name={k} value={v} /> : null,
          )}
          <label htmlFor="sort" className="text-sm text-muted-foreground">Sort</label>
          <SortSelect current={f.sort ?? "newest"} />
        </AutoSubmitForm>
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link key={c.key} href={catalogHref(params, { [c.key]: null })} className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-3 py-1 text-sm text-brand-brown hover:bg-accent">
              {c.label} <X className="size-3.5" aria-label="Remove filter" />
            </Link>
          ))}
          <Link href="/books" className="px-2 py-1 text-sm font-medium text-brand-caramel hover:underline">Clear all</Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-44 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-sans text-sm font-bold tracking-widest text-brand-caramel uppercase">Filter books</h2>
            {filters}
          </div>
        </aside>
        <details className="rounded-xl border border-border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4" /> Filters {chips.length > 0 && `(${chips.length})`}
          </summary>
          <div className="mt-4">{filters}</div>
        </details>

        <div>
          {result.books.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <p className="text-lg font-semibold">No books match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
              <Link href="/books" className="mt-6 inline-flex h-10 items-center rounded-full bg-brand-brown px-6 text-sm font-semibold text-brand-cream">
                Browse all books
              </Link>
            </div>
          ) : (
            <BookGrid books={result.books} wishlistIds={wishlistIds} prioritizeFirst />
          )}

          {result.pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
              {result.page > 1 && (
                <Link href={catalogHref(params, { page: result.page - 1 })} className="grid size-10 place-items-center rounded-md border border-input hover:bg-muted" aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {Array.from({ length: result.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === result.pages || Math.abs(p - result.page) <= 2)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
                    <Link
                      href={catalogHref(params, { page: p })}
                      aria-current={p === result.page ? "page" : undefined}
                      className={`grid size-10 place-items-center rounded-md text-sm font-medium ${p === result.page ? "bg-brand-brown text-brand-cream" : "border border-input hover:bg-muted"}`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {result.page < result.pages && (
                <Link href={catalogHref(params, { page: result.page + 1 })} className="grid size-10 place-items-center rounded-md border border-input hover:bg-muted" aria-label="Next page">
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function SortSelect({ current }: { current: string }) {
  return (
    <>
      <select id="sort" name="sort" defaultValue={current} className={`${selectCls} w-48`}>
        {Object.entries(SORTS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 rounded-md border border-input px-3 text-sm hover:bg-muted">Go</button>
      </noscript>
    </>
  );
}
