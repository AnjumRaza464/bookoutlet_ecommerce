import Link from "next/link";
import { BookCover } from "./book-cover";
import { Price } from "./price";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { classLabel } from "@/lib/constants";
import { effectivePrice } from "@/lib/pricing";
import type { BookCardData } from "@/lib/catalog";

const short = (s: string) => s.replace(/ \(.*\)/, "");

export function BookCard({ book, wishlisted = false, priority }: { book: BookCardData; wishlisted?: boolean; priority?: boolean }) {
  const href = `/books/${book.slug}`;
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-brown/10">
      <div className="relative">
        <Link href={href} className="block text-[13px] sm:text-sm" aria-label={book.title}>
          <BookCover
            title={book.title}
            coverImage={book.coverImage}
            subject={book.subject.name}
            classLabel={short(classLabel(book.classLevel))}
            category={book.category.name}
            priority={priority}
          />
        </Link>
        {book.discountPercent > 0 && (
          <span className="absolute top-12 right-2 rounded-full bg-brand-caramel px-2 py-0.5 text-[11px] font-bold text-white">
            -{book.discountPercent}%
          </span>
        )}
        {book.stock <= 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-brand-black/85 px-2 py-0.5 text-[11px] font-semibold text-white">
            Out of stock
          </span>
        )}
        <WishlistButton bookId={book.id} initial={wishlisted} className="absolute top-2 right-2" />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <p className="text-[11px] font-semibold tracking-wider text-brand-caramel uppercase">
          {book.category.name} · {short(book.board.name)}
        </p>
        <h3 className="font-sans text-sm leading-snug font-semibold text-foreground">
          <Link href={href} className="line-clamp-2 hover:text-brand-brown-light">
            {book.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{book.publisher.name}</p>
        <Price price={book.price} discountPercent={book.discountPercent} className="mt-auto pt-1" />
        <AddToCartButton
          size="sm"
          className="mt-2"
          book={{ id: book.id, slug: book.slug, title: book.title, price: effectivePrice(book), coverImage: book.coverImage, stock: book.stock }}
        />
      </div>
    </article>
  );
}

export function BookGrid({ books, wishlistIds, prioritizeFirst }: { books: BookCardData[]; wishlistIds?: Set<string>; prioritizeFirst?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {books.map((b, i) => (
        <BookCard key={b.id} book={b} wishlisted={wishlistIds?.has(b.id)} priority={prioritizeFirst && i < 4} />
      ))}
    </div>
  );
}
