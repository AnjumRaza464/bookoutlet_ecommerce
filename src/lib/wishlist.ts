import "server-only";
import { cache } from "react";
import { db } from "./db";
import { getCurrentUser } from "./auth";

/** IDs of books in the signed-in user's wishlist (empty set when signed out). */
export const getWishlistIds = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return new Set<string>();
  const rows = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { bookId: true } });
  return new Set(rows.map((r) => r.bookId));
});
