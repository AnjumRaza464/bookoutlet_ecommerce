import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { Price } from "@/components/books/price";
import { AddToCartButton } from "@/components/books/add-to-cart-button";
import { WishlistButton } from "@/components/books/wishlist-button";
import { BookGrid } from "@/components/books/book-card";
import { SectionHeading } from "@/components/common/section-heading";
import { getBookBySlug, getRelatedBooks } from "@/lib/catalog";
import { classLabel, SITE } from "@/lib/constants";
import { effectivePrice, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPKR } from "@/lib/money";
import { getWishlistIds } from "@/lib/wishlist";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Book not found" };
  const description = `${book.title} by ${book.publisher.name} for ${classLabel(book.classLevel)} (${book.board.name}). Buy online for ${formatPKR(effectivePrice(book))} with delivery across Pakistan.`;
  return {
    title: book.title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: { title: book.title, description, type: "website", images: book.coverImage ? [book.coverImage] : undefined },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  const [related, wishlistIds] = await Promise.all([getRelatedBooks(book), getWishlistIds()]);
  const final = effectivePrice(book);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: book.title,
    description: book.description,
    sku: book.sku,
    ...(book.isbn ? { gtin13: book.isbn } : {}),
    brand: { "@type": "Brand", name: book.publisher.name },
    category: `${book.category.name} > ${classLabel(book.classLevel)}`,
    image: book.coverImage ?? `${SITE.url}/logo.svg`,
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/books/${book.slug}`,
      priceCurrency: "PKR",
      price: final,
      availability: book.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };

  const specs = [
    ["Class", classLabel(book.classLevel)],
    ["Board", book.board.name],
    ["Subject", book.subject.name],
    ["Category", book.category.name],
    ["Publisher", book.publisher.name],
    ["Medium", book.medium],
    ["Edition", book.edition],
    ["Pages", book.pages?.toString()],
    ["Author", book.author],
    ["ISBN", book.isbn],
    ["SKU", book.sku],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-brown">Home</Link> / <Link href="/books" className="hover:text-brand-brown">Books</Link> /{" "}
        <Link href={`/books?class=${book.classLevel}`} className="hover:text-brand-brown">{classLabel(book.classLevel)}</Link> /{" "}
        <span className="text-foreground">{book.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr]">
        <div className="mx-auto w-full max-w-sm md:max-w-none">
          <div className="rounded-2xl bg-brand-cream p-6 sm:p-10">
            <BookCover
              title={book.title}
              coverImage={book.coverImage}
              subject={book.subject.name}
              classLabel={classLabel(book.classLevel).replace(/ \(.*\)/, "")}
              category={book.category.name}
              className="text-lg shadow-2xl shadow-brand-brown/30"
              sizes="(max-width: 768px) 80vw, 420px"
              priority
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-brand-caramel uppercase">
            {book.category.name} · {classLabel(book.classLevel)}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-bold text-brand-black sm:text-4xl">{book.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            by <span className="font-medium text-foreground">{book.author || book.publisher.name}</span> · {book.board.name}
          </p>

          <div className="mt-6">
            <Price price={book.price} discountPercent={book.discountPercent} large />
            {book.discountPercent > 0 && <p className="mt-1 text-sm text-emerald-700">You save {formatPKR(book.price - final)}</p>}
          </div>

          <p className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${book.stock > 0 ? "text-emerald-700" : "text-red-700"}`}>
            <PackageCheck className="size-4" />
            {book.stock <= 0 ? "Out of stock" : book.stock <= book.lowStockAlert ? `Only ${book.stock} left — order soon` : "In stock, ready to ship"}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              withQuantity
              size="lg"
              className="flex-1"
              book={{ id: book.id, slug: book.slug, title: book.title, price: final, coverImage: book.coverImage, stock: book.stock }}
            />
            <WishlistButton bookId={book.id} initial={wishlistIds.has(book.id)} withLabel />
          </div>

          <ul className="mt-8 grid gap-3 rounded-xl border border-border p-5 text-sm sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="size-5 text-brand-caramel" /> Free delivery over {formatPKR(FREE_SHIPPING_THRESHOLD)}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-brand-caramel" /> Easypaisa & COD</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-5 text-brand-caramel" /> Genuine edition</li>
          </ul>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Description</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">{book.description || "No description available."}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Details</h2>
            <dl className="mt-3 grid overflow-hidden rounded-xl border border-border text-sm sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border px-4 py-3 odd:bg-muted/40">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="You may also need" title="Related books" />
          <BookGrid books={related} wishlistIds={wishlistIds} />
        </section>
      )}
    </div>
  );
}
