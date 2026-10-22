import { Check } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700">This order was cancelled.</p>;
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-col items-center text-center">
          <span className={cn("grid size-8 place-items-center rounded-full border-2 text-xs font-bold", i <= idx ? "border-brand-brown bg-brand-brown text-white" : "border-border text-muted-foreground")}>
            {i <= idx ? <Check className="size-4" /> : i + 1}
          </span>
          <span className={cn("mt-1.5 text-[11px] font-medium sm:text-xs", i <= idx ? "text-foreground" : "text-muted-foreground")}>{ORDER_STATUS_LABELS[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderEvents({ events }: { events: { status: string; note: string | null; createdAt: Date | string }[] }) {
  return (
    <ol className="space-y-3 border-l-2 border-brand-cream pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative text-sm">
          <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full bg-brand-caramel" />
          <p className="font-semibold">{ORDER_STATUS_LABELS[e.status]}</p>
          {e.note && <p className="text-muted-foreground">{e.note}</p>}
          <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p>
        </li>
      ))}
    </ol>
  );
}
