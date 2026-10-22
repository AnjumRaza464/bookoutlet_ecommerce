import "server-only";
import { db } from "./db";
import { ApiError } from "./api";
import { slugify } from "./slug";

export const TAXONOMIES = {
  categories: { label: "Categories", singular: "Category", fields: ["description", "sortOrder"] },
  subjects: { label: "Subjects", singular: "Subject", fields: [] },
  boards: { label: "Boards", singular: "Board", fields: ["province"] },
  publishers: { label: "Publishers", singular: "Publisher", fields: ["website"] },
} as const;

export type TaxonomyKind = keyof typeof TAXONOMIES;

export function assertKind(kind: string): TaxonomyKind {
  if (!(kind in TAXONOMIES)) throw new ApiError(404, "Unknown taxonomy");
  return kind as TaxonomyKind;
}

type Input = { name: string; slug?: string; description?: string; province?: string; website?: string; sortOrder?: number };

function dataFor(kind: TaxonomyKind, input: Input) {
  const base = { name: input.name, slug: input.slug || slugify(input.name) };
  switch (kind) {
    case "categories":
      return { ...base, description: input.description || null, sortOrder: input.sortOrder ?? 0 };
    case "boards":
      return { ...base, province: input.province || null };
    case "publishers":
      return { ...base, website: input.website || null };
    default:
      return base;
  }
}

export async function listTaxonomy(kind: TaxonomyKind) {
  const include = { _count: { select: { books: true } } };
  switch (kind) {
    case "categories":
      return db.category.findMany({ include, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    case "subjects":
      return db.subject.findMany({ include, orderBy: { name: "asc" } });
    case "boards":
      return db.board.findMany({ include, orderBy: { name: "asc" } });
    case "publishers":
      return db.publisher.findMany({ include, orderBy: { name: "asc" } });
  }
}

export async function createTaxonomy(kind: TaxonomyKind, input: Input) {
  const data = dataFor(kind, input);
  switch (kind) {
    case "categories":
      return db.category.create({ data });
    case "subjects":
      return db.subject.create({ data });
    case "boards":
      return db.board.create({ data });
    case "publishers":
      return db.publisher.create({ data });
  }
}

export async function updateTaxonomy(kind: TaxonomyKind, id: string, input: Input) {
  const data = dataFor(kind, input);
  switch (kind) {
    case "categories":
      return db.category.update({ where: { id }, data });
    case "subjects":
      return db.subject.update({ where: { id }, data });
    case "boards":
      return db.board.update({ where: { id }, data });
    case "publishers":
      return db.publisher.update({ where: { id }, data });
  }
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string) {
  const field = { categories: "categoryId", subjects: "subjectId", boards: "boardId", publishers: "publisherId" }[kind];
  const inUse = await db.book.count({ where: { [field]: id } });
  if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} book(s) still use this ${TAXONOMIES[kind].singular.toLowerCase()}. Reassign them first.`);
  switch (kind) {
    case "categories":
      return db.category.delete({ where: { id } });
    case "subjects":
      return db.subject.delete({ where: { id } });
    case "boards":
      return db.board.delete({ where: { id } });
    case "publishers":
      return db.publisher.delete({ where: { id } });
  }
}
