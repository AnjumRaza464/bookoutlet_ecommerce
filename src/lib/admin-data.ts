import type { bookSchema, couponSchema } from "./validation";
import { slugify } from "./slug";

export function bookData(input: ReturnType<typeof bookSchema.parse>) {
  return {
    title: input.title,
    slug: input.slug || slugify(input.title),
    description: input.description,
    author: input.author || null,
    isbn: input.isbn || null,
    sku: input.sku.toUpperCase(),
    classLevel: input.classLevel,
    level: input.classLevel <= 10 ? ("MATRIC" as const) : ("INTERMEDIATE" as const),
    medium: input.medium,
    edition: input.edition || null,
    pages: input.pages === "" || input.pages === undefined ? null : input.pages,
    coverImage: input.coverImage || null,
    price: input.price,
    discountPercent: input.discountPercent,
    stock: input.stock,
    lowStockAlert: input.lowStockAlert,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    categoryId: input.categoryId,
    boardId: input.boardId,
    subjectId: input.subjectId,
    publisherId: input.publisherId,
  };
}

export function couponData(c: ReturnType<typeof couponSchema.parse>) {
  return {
    code: c.code,
    description: c.description || null,
    type: c.type,
    value: c.value,
    minOrder: c.minOrder,
    maxUses: c.maxUses === "" || c.maxUses === undefined ? null : c.maxUses,
    startsAt: c.startsAt ? new Date(c.startsAt) : null,
    endsAt: c.endsAt ? new Date(c.endsAt) : null,
    isActive: c.isActive,
  };
}

