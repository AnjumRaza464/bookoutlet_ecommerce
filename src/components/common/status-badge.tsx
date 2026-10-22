import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ORDER_TONES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-sky-100 text-sky-900",
  PROCESSING: "bg-indigo-100 text-indigo-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

const PAYMENT_TONES: Record<string, string> = {
  UNPAID: "bg-zinc-100 text-zinc-800",
  PENDING: "bg-amber-100 text-amber-900",
  AWAITING_VERIFICATION: "bg-orange-100 text-orange-900",
  PAID: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-red-100 text-red-900",
  REFUNDED: "bg-zinc-200 text-zinc-700",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", ORDER_TONES[status], className)}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", PAYMENT_TONES[status], className)}>{PAYMENT_STATUS_LABELS[status] ?? status}</span>;
}
