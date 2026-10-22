"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api, FetchError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export function WishlistButton({ bookId, initial, className, withLabel }: { bookId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const [active, setActive] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    start(async () => {
      try {
        if (active) await api(`/api/wishlist/${bookId}`, { method: "DELETE" });
        else await api("/api/wishlist", { body: { bookId } });
        setActive(!active);
        toast.success(active ? "Removed from wishlist" : "Saved to wishlist");
        router.refresh();
      } catch (e) {
        if (e instanceof FetchError && e.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        toast.error(e instanceof Error ? e.message : "Could not update wishlist");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/90 text-brand-brown shadow-sm transition hover:bg-brand-cream disabled:opacity-60",
        withLabel ? "h-11 px-4 text-sm font-medium" : "size-9",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-red-600 text-red-600")} />
      {withLabel && (active ? "In wishlist" : "Add to wishlist")}
    </button>
  );
}
