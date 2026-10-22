import { formatPKR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import type { ServerQuote } from "./use-quote";

export function OrderSummary({ quote, loading, children }: { quote: ServerQuote | null; loading?: boolean; children?: React.ReactNode }) {
  const rows = quote
    ? [
        ["Subtotal", formatPKR(quote.subtotal)],
        ...(quote.discountTotal > 0 ? [[`Discount${quote.couponCode ? ` (${quote.couponCode})` : ""}`, `− ${formatPKR(quote.discountTotal)}`]] : []),
        ["Delivery", quote.shippingFee === 0 ? "Free" : formatPKR(quote.shippingFee)],
      ]
    : [];
  const toFree = quote ? FREE_SHIPPING_THRESHOLD - (quote.subtotal - quote.discountTotal) : 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-6" aria-busy={loading}>
      <h2 className="text-xl font-bold">Order summary</h2>
      <dl className={`mt-4 space-y-2 text-sm transition-opacity ${loading ? "opacity-50" : ""}`}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-bold text-brand-brown">{quote ? formatPKR(quote.total) : "—"}</dd>
        </div>
      </dl>
      {quote && toFree > 0 && quote.itemCount > 0 && (
        <p className="mt-3 rounded-lg bg-brand-cream px-3 py-2 text-xs text-brand-brown">
          Add {formatPKR(toFree)} more for <strong>free delivery</strong>.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">All prices in Pakistani Rupees. Final amount is confirmed by our server at checkout.</p>
      {children}
    </div>
  );
}
