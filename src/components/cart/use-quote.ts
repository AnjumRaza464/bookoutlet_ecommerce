"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";
import { cart, type CartItem } from "@/lib/cart-store";
import type { Quote } from "@/lib/pricing";

export type ServerQuote = Quote & {
  lines: (Quote["lines"][number] & { slug: string; coverImage: string | null })[];
  missing: string[];
};

type State = { key: string; quote: ServerQuote | null; error: string | null };

/** Fetches an authoritative server quote whenever the cart or coupon changes. */
export function useQuote(items: CartItem[], couponCode: string) {
  const key = JSON.stringify(items.map((i) => [i.bookId, i.quantity])) + couponCode;
  const [state, setState] = useState<State>({ key: "", quote: null, error: null });

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const q = await api<ServerQuote>("/api/cart/quote", {
          body: { items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })), couponCode },
        });
        if (cancelled) return;
        setState({ key, quote: q, error: null });
        q.missing.forEach((id) => cart.remove(id));
        cart.syncPrices(q.lines);
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, key, error: e instanceof Error ? e.message : "Could not price your cart" }));
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (items.length === 0) return { quote: null, loading: false, error: null };
  return { quote: state.quote, loading: state.key !== key, error: state.error };
}
