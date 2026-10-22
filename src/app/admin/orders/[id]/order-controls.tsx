"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";

const NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

type Order = { id: string; status: string; paymentStatus: string; paymentMethod: string; courier: string; trackingNumber: string };

export function OrderAdminControls({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(order.courier);
  const [tracking, setTracking] = useState(order.trackingNumber);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function update(body: Record<string, unknown>, label: string) {
    setPending(label);
    try {
      await api(`/api/admin/orders/${order.id}`, { method: "PATCH", body });
      toast.success("Order updated");
      setNote("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update order");
    } finally {
      setPending(null);
    }
  }

  const options = [order.status, ...NEXT[order.status]];

  return (
    <div className="space-y-5 text-sm">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          update({ status, courier: courier || undefined, trackingNumber: tracking || undefined, note: note || undefined }, "save");
        }}
      >
        <div className="space-y-1">
          <label htmlFor="o-status" className="font-medium">Order status</label>
          <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${adminInput} w-full`} disabled={options.length === 1}>
            {options.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}{s === order.status ? " (current)" : ""}</option>
            ))}
          </select>
          {status === "CANCELLED" && status !== order.status && <p className="text-xs text-amber-700">Cancelling returns all items to stock.</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="o-courier" className="font-medium">Courier</label>
            <input id="o-courier" list="couriers" value={courier} onChange={(e) => setCourier(e.target.value)} className={`${adminInput} w-full`} />
            <datalist id="couriers">
              {["TCS", "Leopards", "M&P", "Trax", "PostEx", "Pakistan Post", "BlueEx"].map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label htmlFor="o-tracking" className="font-medium">Tracking no.</label>
            <input id="o-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} className={`${adminInput} w-full`} />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="o-note" className="font-medium">Note for history (optional)</label>
          <input id="o-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={`${adminInput} w-full`} />
        </div>
        <button disabled={!!pending} className={`${adminBtn} w-full`}>
          {pending === "save" && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>
      </form>

      {order.paymentMethod === "COD" && order.status !== "CANCELLED" && (
        <div className="border-t border-border pt-4">
          <p className="mb-2 font-medium">Cash on Delivery</p>
          {order.paymentStatus === "PAID" ? (
            <p className="text-emerald-700">Cash collected.</p>
          ) : (
            <button type="button" disabled={!!pending} onClick={() => update({ paymentStatus: "PAID", note: "COD cash collected" }, "cod")} className={`${adminBtnOutline} w-full`}>
              {pending === "cod" && <Loader2 className="size-4 animate-spin" />} Mark cash collected
            </button>
          )}
        </div>
      )}
      {order.paymentStatus === "PAID" && (
        <div className="border-t border-border pt-4">
          <button type="button" disabled={!!pending} onClick={() => update({ paymentStatus: "REFUNDED", note: "Payment refunded" }, "refund")} className={`${adminBtnOutline} w-full text-destructive`}>
            {pending === "refund" && <Loader2 className="size-4 animate-spin" />} Mark as refunded
          </button>
          <p className="mt-1 text-xs text-muted-foreground">Record only — send the refund through Easypaisa yourself.</p>
        </div>
      )}
    </div>
  );
}

export function PaymentReview({ paymentId, method, status }: { paymentId: string; method: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "verify") {
    setPending(action);
    try {
      const r = await api<{ message?: string }>(`/api/admin/payments/${paymentId}`, { body: { action } });
      toast.success(r.message ?? (action === "approve" ? "Payment approved" : action === "reject" ? "Payment rejected" : "Verification complete"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPending(null);
    }
  }

  if (method === "EASYPAISA_MANUAL" && status === "AWAITING_VERIFICATION") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <p className="w-full text-xs text-muted-foreground">Check your Easypaisa merchant statement for this TID and amount before approving.</p>
        <button type="button" onClick={() => act("approve")} disabled={!!pending} className={adminBtn}>
          {pending === "approve" && <Loader2 className="size-4 animate-spin" />} Approve payment
        </button>
        <button type="button" onClick={() => act("reject")} disabled={!!pending} className={`${adminBtnOutline} text-destructive`}>
          {pending === "reject" && <Loader2 className="size-4 animate-spin" />} Reject
        </button>
      </div>
    );
  }
  if (method === "EASYPAISA" && status !== "PAID") {
    return (
      <button type="button" onClick={() => act("verify")} disabled={!!pending} className={`${adminBtnOutline} mt-3`}>
        {pending === "verify" && <Loader2 className="size-4 animate-spin" />} Re-check with Easypaisa
      </button>
    );
  }
  return null;
}
