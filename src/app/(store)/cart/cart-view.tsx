"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { OrderSummary } from "@/components/cart/order-summary";
import { useQuote } from "@/components/cart/use-quote";
import { primaryBtn } from "@/components/common/field";
import { cart, useCart } from "@/lib/cart-store";
import { formatPKR } from "@/lib/money";

export function CartView() {
  const items = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const { quote, loading, error } = useQuote(items, coupon);

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-16 text-center">
        <ShoppingBag className="mx-auto size-12 text-brand-caramel" />
        <p className="mt-4 text-lg font-semibold">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Browse textbooks, guides and past papers for your class.</p>
        <Link href="/books" className={`${primaryBtn} mt-6`}>
          Start shopping
        </Link>
      </div>
    );
  }

  const lineFor = (id: string) => quote?.lines.find((l) => l.bookId === id);
  const checkoutHref = `/checkout${coupon && quote?.couponCode ? `?coupon=${encodeURIComponent(coupon)}` : ""}`;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => {
            const line = lineFor(item.bookId);
            const unit = line?.unitPrice ?? item.price;
            return (
              <li key={item.bookId} className="flex gap-4 p-4">
                <Link href={`/books/${item.slug}`} className="w-20 shrink-0 text-[9px] sm:w-24">
                  <BookCover title={item.title} coverImage={item.coverImage} sizes="96px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/books/${item.slug}`} className="line-clamp-2 font-semibold hover:text-brand-brown-light">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{formatPKR(unit)} each</p>
                  {line?.error && (
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-destructive">
                      <AlertTriangle className="size-4" /> {line.error}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex h-9 items-center rounded-md border border-input">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        className="grid h-full w-9 place-items-center"
                        onClick={() => cart.setQuantity(item.bookId, item.quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.title}`}
                        className="grid h-full w-9 place-items-center disabled:opacity-40"
                        disabled={item.quantity >= 20 || (line ? item.quantity >= line.available : false)}
                        onClick={() => cart.setQuantity(item.bookId, item.quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold">{formatPKR(unit * item.quantity)}</span>
                    <button type="button" onClick={() => cart.remove(item.bookId)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/books" className="font-medium text-brand-brown hover:underline">
            ← Continue shopping
          </Link>
          <button type="button" onClick={() => cart.clear()} className="text-muted-foreground hover:text-destructive">
            Clear cart
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <form
          className="rounded-2xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setCoupon(couponInput.trim().toUpperCase());
          }}
        >
          <label htmlFor="coupon" className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="size-4 text-brand-caramel" /> Coupon code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="e.g. WELCOME10"
              className="h-10 min-w-0 flex-1 rounded-md border border-input px-3 text-sm uppercase outline-none focus:border-brand-caramel"
            />
            <button className="h-10 rounded-md bg-brand-black px-4 text-sm font-semibold text-white hover:bg-brand-brown">Apply</button>
          </div>
          {coupon && quote?.couponError && <p className="mt-2 text-xs text-destructive">{quote.couponError}</p>}
          {coupon && quote?.couponCode && (
            <p className="mt-2 text-xs text-emerald-700">
              {quote.couponCode} applied.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setCoupon("");
                  setCouponInput("");
                }}
              >
                Remove
              </button>
            </p>
          )}
        </form>
        <OrderSummary quote={quote} loading={loading}>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Link
            href={checkoutHref}
            aria-disabled={!quote || quote.hasErrors}
            className={`${primaryBtn} mt-5 w-full ${!quote || quote.hasErrors ? "pointer-events-none opacity-50" : ""}`}
          >
            Proceed to checkout
          </Link>
          {quote?.hasErrors && <p className="mt-2 text-xs text-destructive">Please fix the highlighted items before checking out.</p>}
        </OrderSummary>
      </div>
    </div>
  );
}
