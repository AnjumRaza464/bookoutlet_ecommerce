import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getFacets } from "@/lib/catalog";
import { AdminHeader, adminBtnOutline } from "@/components/admin/ui";
import { BookForm } from "@/components/admin/book-form";

export const metadata = { title: "Edit book" };

type Props = { params: Promise<{ id: string }> };

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;
  const [book, f, sold] = await Promise.all([
    db.book.findUnique({ where: { id } }),
    getFacets(),
    db.orderItem.aggregate({ where: { bookId: id, order: { status: { not: "CANCELLED" } } }, _sum: { quantity: true } }),
  ]);
  if (!book) notFound();
  return (
    <>
      <AdminHeader
        title={book.title}
        description={`${sold._sum.quantity ?? 0} copies sold · last updated ${book.updatedAt.toLocaleString("en-PK")}`}
        actions={
          book.isActive ? (
            <Link href={`/books/${book.slug}`} target="_blank" className={adminBtnOutline}>
              View in store <ExternalLink className="size-3.5" />
            </Link>
          ) : null
        }
      />
      <BookForm
        bookId={book.id}
        options={f}
        initial={{
          title: book.title,
          slug: book.slug,
          description: book.description,
          author: book.author ?? "",
          isbn: book.isbn ?? "",
          sku: book.sku,
          classLevel: book.classLevel,
          medium: book.medium,
          edition: book.edition ?? "",
          pages: book.pages ?? "",
          coverImage: book.coverImage ?? "",
          price: book.price,
          discountPercent: book.discountPercent,
          stock: book.stock,
          lowStockAlert: book.lowStockAlert,
          isActive: book.isActive,
          isFeatured: book.isFeatured,
          categoryId: book.categoryId,
          boardId: book.boardId,
          subjectId: book.subjectId,
          publisherId: book.publisherId,
        }}
      />
    </>
  );
}
