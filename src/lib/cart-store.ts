"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  bookId: string;
  slug: string;
  title: string;
  /** Display-only snapshot; the server always re-prices the cart. */
  price: number;
  coverImage: string | null;
  quantity: number;
};

const KEY = "bnb_cart_v1";
const MAX_QTY = 20;
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.bookId === "string" && i.quantity > 0) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode); keep in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const items = read();
    const existing = items.find((i) => i.bookId === item.bookId);
    if (existing) {
      write(items.map((i) => (i.bookId === item.bookId ? { ...i, ...item, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i)));
    } else {
      write([...items, { ...item, quantity: Math.min(MAX_QTY, quantity) }]);
    }
  },
  setQuantity(bookId: string, quantity: number) {
    if (quantity <= 0) return cart.remove(bookId);
    write(read().map((i) => (i.bookId === bookId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)));
  },
  remove(bookId: string) {
    write(read().filter((i) => i.bookId !== bookId));
  },
  clear() {
    write([]);
  },
  /** Syncs display data (prices) with a fresh server quote. */
  syncPrices(lines: { bookId: string; unitPrice: number }[]) {
    const map = new Map(lines.map((l) => [l.bookId, l.unitPrice]));
    const items = read();
    if (items.some((i) => map.has(i.bookId) && map.get(i.bookId) !== i.price)) {
      write(items.map((i) => (map.has(i.bookId) ? { ...i, price: map.get(i.bookId)! } : i)));
    }
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  const items = useCart();
  return items.reduce((s, i) => s + i.quantity, 0);
}
