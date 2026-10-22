import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Books by board",
  description: "Browse Matric and Intermediate books for FBISE, BISE Lahore, Karachi, Peshawar and other boards.",
  alternates: { canonical: "/boards" },
};

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const boards = await db.board.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: { where: { isActive: true } } } } },
  });
  return (
    <div className="container-page py-16">
      <SectionHeading eyebrow="Boards" title="Shop by examination board" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <Link key={b.id} href={`/books?board=${b.slug}`} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition hover:border-brand-caramel hover:shadow-lg">
            <MapPin className="mt-1 size-6 shrink-0 text-brand-caramel" />
            <span>
              <span className="block text-lg font-bold text-brand-black">{b.name}</span>
              <span className="text-sm text-muted-foreground">
                {b.province} · {b._count.books} titles
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
