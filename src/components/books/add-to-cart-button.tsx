"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Props = {
  book: { id: string; slug: string; title: string; price: number; coverImage: string | null; stock: number };
  withQuantity?: boolean;
  className?: string;
  size?: "default" | "lg" | "sm";
};

export function AddToCartButton({ book, withQuantity, className, size = "default" }: Props) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const out = book.stock <= 0;
  const max = Math.min(20, book.stock);

  function add() {
    cart.add({ bookId: book.id, slug: book.slug, title: book.title, price: book.price, coverImage: book.coverImage }, qty);
    toast.success("Added to cart", { description: book.title, action: { label: "View cart", onClick: () => router.push("/cart") } });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {withQuantity && !out && (
        <div className="flex h-11 items-center rounded-md border border-input bg-background">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="grid h-full w-10 place-items-center disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="grid h-full w-10 place-items-center disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max}
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
      <Button
        type="button"
        onClick={add}
        disabled={out}
        className={cn(
          "flex-1 bg-brand-brown text-brand-cream hover:bg-brand-black",
          size === "lg" && "h-11 px-6 text-base",
          size === "sm" && "h-9",
        )}
      >
        <ShoppingBag className="size-4" />
        {out ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  );
}
