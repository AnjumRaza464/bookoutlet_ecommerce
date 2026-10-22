import "server-only";
import { cache } from "react";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;

export const SORTS = {
  newest: { label: "Newest", orderBy: { createdAt: "desc" } },
  "price-asc": { label: "Price: Low to High", orderBy: { price: "asc" } },
  "price-desc": { label: "Price: High to Low", orderBy: { price: "desc" } },
  title: { label: "Title A–Z", orderBy: { title: "asc" } },
} satisfies Record<string, { label: string; orderBy: Prisma.BookOrderByWithRelationInput }>;

export type SortKey = keyof typeof SORTS;

export type CatalogFilters = {
  q?: string;
  classLevel?: number;
  level?: "MATRIC" | "INTERMEDIATE";
  board?: string;
  subject?: string;
  category?: string;
  publisher?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function parseFilters(params: RawParams): CatalogFilters {
  const classLevel = num(one(params.class));
  const level = one(params.level)?.toUpperCase();
  const sort = one(params.sort);
  return {
    q: one(params.q)?.trim().slice(0, 100) || undefined,
    classLevel: classLevel && classLevel >= 9 && classLevel <= 12 ? classLevel : undefined,
    level: level === "MATRIC" || level === "INTERMEDIATE" ? level : undefined,
    board: one(params.board) || undefined,
    subject: one(params.subject) || undefined,
    category: one(params.category) || undefined,
    publisher: one(params.publisher) || undefined,
    minPrice: num(one(params.min)),
    maxPrice: num(one(params.max)),
    inStock: one(params.stock) === "1" || undefined,
    sort: sort && sort in SORTS ? (sort as SortKey) : "newest",
    page: Math.max(1, num(one(params.page)) ?? 1),
  };
}

export function buildWhere(f: CatalogFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { isActive: true };
  if (f.q) {
    where.OR = [
      { title: { contains: f.q, mode: "insensitive" } },
      { author: { contains: f.q, mode: "insensitive" } },
      { isbn: { contains: f.q } },
      { subject: { name: { contains: f.q, mode: "insensitive" } } },
      { publisher: { name: { contains: f.q, mode: "insensitive" } } },
    ];
  }
  if (f.classLevel) where.classLevel = f.classLevel;
  if (f.level) where.level = f.level;
  if (f.board) where.board = { slug: f.board };
  if (f.subject) where.subject = { slug: f.subject };
  if (f.category) where.category = { slug: f.category };
  if (f.publisher) where.publisher = { slug: f.publisher };
  if (f.minPrice !== undefined || f.maxPrice !== undefined) where.price = { gte: f.minPrice, lte: f.maxPrice };
  if (f.inStock) where.stock = { gt: 0 };
  return where;
}

export const bookCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  discountPercent: true,
  stock: true,
  coverImage: true,
  classLevel: true,
  medium: true,
  board: { select: { name: true, slug: true } },
  subject: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  publisher: { select: { name: true } },
} satisfies Prisma.BookSelect;

export type BookCardData = Prisma.BookGetPayload<{ select: typeof bookCardSelect }>;

export async function searchBooks(f: CatalogFilters) {
  const where = buildWhere(f);
  const page = f.page ?? 1;
  const [total, books] = await Promise.all([
    db.book.count({ where }),
    db.book.findMany({
      where,
      select: bookCardSelect,
      orderBy: [SORTS[f.sort ?? "newest"].orderBy, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, books, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const getFacets = cache(async () => {
  const [boards, subjects, categories, publishers] = await Promise.all([
    db.board.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.publisher.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { boards, subjects, categories, publishers };
});

export async function getFeaturedBooks(take = 8) {
  return db.book.findMany({
    where: { isActive: true, isFeatured: true },
    select: bookCardSelect,
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getNewArrivals(take = 8) {
  return db.book.findMany({ where: { isActive: true }, select: bookCardSelect, orderBy: { createdAt: "desc" }, take });
}

export const getBookBySlug = cache(async (slug: string) => {
  return db.book.findFirst({
    where: { slug, isActive: true },
    include: { board: true, subject: true, category: true, publisher: true },
  });
});

export async function getRelatedBooks(book: { id: string; classLevel: number; subjectId: string }, take = 4) {
  return db.book.findMany({
    where: { isActive: true, id: { not: book.id }, OR: [{ subjectId: book.subjectId }, { classLevel: book.classLevel }] },
    select: bookCardSelect,
    orderBy: { isFeatured: "desc" },
    take,
  });
}

/** Builds a catalogue URL preserving existing filters. */
export function catalogHref(base: RawParams, overrides: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    const val = one(v);
    if (val) sp.set(k, val);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === null || v === "") sp.delete(k);
    else sp.set(k, String(v));
  }
  if (!("page" in overrides)) sp.delete("page");
  const s = sp.toString();
  return `/books${s ? `?${s}` : ""}`;
}
