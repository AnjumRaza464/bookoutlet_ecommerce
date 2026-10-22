import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookCardSelect } from "@/lib/catalog";
import { BookGrid } from "@/components/books/book-card";
import { primaryBtn } from "@/components/common/field";

export const metadata: Metadata = { title: "My wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const rows = await db.wishlistItem.findMany({
    where: { userId: user.id, book: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: { book: { select: bookCardSelect } },
  });
  const books = rows.map((r) => r.book);
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Wishlist ({books.length})</h2>
      {books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Tap the heart on any book to save it here.</p>
          <Link href="/books" className={`${primaryBtn} mt-4`}>Browse books</Link>
        </div>
      ) : (
        <BookGrid books={books} wishlistIds={new Set(books.map((b) => b.id))} />
      )}
    </section>
  );
}
