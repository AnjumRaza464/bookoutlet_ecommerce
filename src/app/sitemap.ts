import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories, boards] = await Promise.all([
    db.book.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.board.findMany({ select: { slug: true } }),
  ]);
  const base = SITE.url;
  const statics = ["", "/books", "/boards", "/about", "/contact", "/policies", "/track"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const classes = [9, 10, 11, 12].map((c) => ({ url: `${base}/books?class=${c}`, changeFrequency: "weekly" as const, priority: 0.8 }));
  return [
    ...statics,
    ...classes,
    ...categories.map((c) => ({ url: `${base}/books?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...boards.map((b) => ({ url: `${base}/books?board=${b.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...books.map((b) => ({ url: `${base}/books/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
