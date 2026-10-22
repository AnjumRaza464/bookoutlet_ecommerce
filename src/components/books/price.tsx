import { formatPKR } from "@/lib/money";
import { effectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Price({ price, discountPercent, className, large }: { price: number; discountPercent: number; className?: string; large?: boolean }) {
  const final = effectivePrice({ price, discountPercent });
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold text-brand-brown", large ? "text-3xl" : "text-base")}>{formatPKR(final)}</span>
      {discountPercent > 0 && (
        <>
          <span className={cn("text-muted-foreground line-through", large ? "text-lg" : "text-xs")}>{formatPKR(price)}</span>
          <span className={cn("font-semibold text-emerald-700", large ? "text-sm" : "text-xs")}>-{discountPercent}%</span>
        </>
      )}
    </span>
  );
}
