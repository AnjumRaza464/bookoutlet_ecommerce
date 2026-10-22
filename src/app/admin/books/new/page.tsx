import { getFacets } from "@/lib/catalog";
import { suggestSku } from "@/lib/slug";
import { AdminHeader } from "@/components/admin/ui";
import { BookForm } from "@/components/admin/book-form";

export const metadata = { title: "Add book" };

export default async function NewBookPage() {
  const f = await getFacets();
  return (
    <>
      <AdminHeader title="Add a book" />
      <BookForm
        options={f}
        initial={{
          title: "",
          slug: "",
          description: "",
          author: "",
          isbn: "",
          sku: suggestSku(),
          classLevel: 9,
          medium: "English",
          edition: `${new Date().getFullYear()} Edition`,
          pages: "",
          coverImage: "",
          price: 500,
          discountPercent: 0,
          stock: 10,
          lowStockAlert: 5,
          isActive: true,
          isFeatured: false,
          categoryId: f.categories[0]?.id ?? "",
          boardId: f.boards[0]?.id ?? "",
          subjectId: f.subjects[0]?.id ?? "",
          publisherId: f.publishers[0]?.id ?? "",
        }}
      />
    </>
  );
}
