"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, Clock, Copy, Loader2, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Field, outlineBtn, primaryBtn } from "@/components/common/field";
import { api, FetchError } from "@/lib/fetcher";
import { formatPKR } from "@/lib/money";

type Props = {
  order: { orderNumber: string; total: number; status: string; paymentMethod: string; paymentStatus: string; phone: string };
  latestPayment: { status: string; responseDesc: string | null; manualTid: string | null } | null;
  easypaisaOnline: boolean;
  manualAccount: { number: string; title: string };
};

export function PaymentPanel({ order, latestPayment, easypaisaOnline, manualAccount }: Props) {
  if (order.status === "CANCELLED") return null;

  if (order.paymentStatus === "PAID") {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <CheckCircle2 className="size-6" />
        <p className="font-semibold">Payment of {formatPKR(order.total)} received. Thank you!</p>
      </section>
    );
  }

  if (order.paymentMethod === "COD") {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <Banknote className="size-6 text-brand-caramel" />
        <p>
          <strong>Cash on Delivery:</strong> please keep {formatPKR(order.total)} ready when your parcel arrives.
        </p>
      </section>
    );
  }

  if (order.paymentMethod === "EASYPAISA") {
    return <EasypaisaOnline order={order} lastMessage={latestPayment?.responseDesc ?? null} enabled={easypaisaOnline} />;
  }

  return <ManualTransfer order={order} latestPayment={latestPayment} account={manualAccount} />;
}

function EasypaisaOnline({ order, lastMessage, enabled }: { order: Props["order"]; lastMessage: string | null; enabled: boolean }) {
  const router = useRouter();
  const [mobile, setMobile] = useState(order.phone);
  const [stage, setStage] = useState<"idle" | "waiting" | "checking">("idle");
  const [message, setMessage] = useState<string | null>(order.paymentStatus === "FAILED" ? lastMessage : null);
  const [error, setError] = useState<string>();

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setStage("waiting");
    setError(undefined);
    setMessage(null);
    try {
      const r = await api<{ outcome: string; message: string }>("/api/payments/easypaisa/initiate", {
        body: { orderNumber: order.orderNumber, mobileAccountNo: mobile },
      });
      setMessage(r.message);
      if (r.outcome === "PAID") toast.success("Payment received!");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError && err.fields?.mobileAccountNo) setError(err.fields.mobileAccountNo);
      toast.error(err instanceof Error ? err.message : "Payment could not be started");
    } finally {
      setStage("idle");
    }
  }

  async function check() {
    setStage("checking");
    try {
      const r = await api<{ outcome: string; message: string }>("/api/payments/easypaisa/verify", { body: { orderNumber: order.orderNumber } });
      setMessage(r.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check payment");
    } finally {
      setStage("idle");
    }
  }

  return (
    <section className="rounded-2xl border-2 border-brand-caramel bg-card p-6">
      <div className="flex items-center gap-3">
        <Smartphone className="size-7 text-brand-caramel" />
        <div>
          <h3 className="text-lg font-bold">Pay {formatPKR(order.total)} with Easypaisa</h3>
          <p className="text-sm text-muted-foreground">We&apos;ll send a payment request to your Easypaisa mobile account. Approve it in the app or USSD prompt.</p>
        </div>
      </div>
      {!enabled ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Online Easypaisa payments are temporarily unavailable. Please contact support to switch this order to manual transfer or Cash on Delivery.
        </p>
      ) : (
        <form onSubmit={pay} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field label="Easypaisa mobile account" name="ep-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} error={error} inputMode="tel" className="flex-1" />
          <div className="flex gap-2 sm:pt-6">
            <button disabled={stage !== "idle"} className={primaryBtn}>
              {stage === "waiting" && <Loader2 className="size-4 animate-spin" />}
              {order.paymentStatus === "FAILED" ? "Try again" : "Pay now"}
            </button>
            {(order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") && (
              <button type="button" onClick={check} disabled={stage !== "idle"} className={outlineBtn}>
                {stage === "checking" && <Loader2 className="size-4 animate-spin" />} Check status
              </button>
            )}
          </div>
        </form>
      )}
      {stage === "waiting" && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-brand-cream p-3 text-sm text-brand-brown" role="status">
          <Clock className="size-4" /> Waiting for you to approve the request on your phone… this can take up to a minute.
        </p>
      )}
      {message && stage === "idle" && <p className="mt-4 rounded-lg bg-muted p-3 text-sm" role="status">{message}</p>}
      {(order.paymentStatus === "FAILED" || !enabled) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Prefer another way?</span>
          <SwitchMethodButton orderNumber={order.orderNumber} method="EASYPAISA_MANUAL" label="Pay by manual transfer" />
          <SwitchMethodButton orderNumber={order.orderNumber} method="COD" label="Switch to Cash on Delivery" />
        </div>
      )}
    </section>
  );
}

function SwitchMethodButton({ orderNumber, method, label }: { orderNumber: string; method: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-input bg-white px-4 font-semibold hover:bg-muted disabled:opacity-60"
      onClick={async () => {
        setPending(true);
        try {
          await api(`/api/orders/${orderNumber}/payment-method`, { body: { method } });
          toast.success("Payment method updated");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not change payment method");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" />} {label}
    </button>
  );
}

function ManualTransfer({ order, latestPayment, account }: { order: Props["order"]; latestPayment: Props["latestPayment"]; account: Props["manualAccount"] }) {
  const router = useRouter();
  const [tid, setTid] = useState("");
  const [sender, setSender] = useState(order.phone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const awaiting = order.paymentStatus === "AWAITING_VERIFICATION";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      const r = await api<{ message: string }>(`/api/orders/${order.orderNumber}/manual-payment`, { body: { transactionId: tid, senderNumber: sender } });
      toast.success(r.message);
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setPending(false);
    }
  }

  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => toast.success("Copied"));

  return (
    <section className="rounded-2xl border-2 border-brand-caramel bg-card p-6">
      <div className="flex items-center gap-3">
        <Wallet className="size-7 text-brand-caramel" />
        <div>
          <h3 className="text-lg font-bold">Manual Easypaisa transfer</h3>
          <p className="text-sm text-muted-foreground">This is a manual payment. Your order is confirmed only after our team verifies the transfer.</p>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-xl bg-brand-cream p-4">
          <p className="text-xs font-bold tracking-wide text-brand-caramel uppercase">Step 1 · Send</p>
          <p className="mt-1 text-2xl font-bold text-brand-brown">{formatPKR(order.total)}</p>
        </li>
        <li className="rounded-xl bg-brand-cream p-4">
          <p className="text-xs font-bold tracking-wide text-brand-caramel uppercase">Step 2 · To Easypaisa account</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold">
            {account.number}
            <button type="button" aria-label="Copy account number" onClick={() => copy(account.number)}><Copy className="size-4" /></button>
          </p>
          <p className="text-muted-foreground">Title: {account.title}</p>
        </li>
        <li className="rounded-xl bg-brand-cream p-4">
          <p className="text-xs font-bold tracking-wide text-brand-caramel uppercase">Step 3 · Reference</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold">
            {order.orderNumber}
            <button type="button" aria-label="Copy order number" onClick={() => copy(order.orderNumber)}><Copy className="size-4" /></button>
          </p>
          <p className="text-muted-foreground">Add this in the transfer note if possible.</p>
        </li>
      </ol>

      {awaiting ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-900" role="status">
          <Clock className="mt-0.5 size-4 shrink-0" />
          Transaction ID <strong>{latestPayment?.manualTid}</strong> submitted. We&apos;re verifying your transfer — you&apos;ll see the status update here.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start" noValidate>
          {order.paymentStatus === "FAILED" && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900 sm:col-span-3">We couldn&apos;t verify your previous transfer. Please check the TID and submit again, or contact support.</p>
          )}
          <Field label="Transaction ID (TID)" name="tid" value={tid} onChange={(e) => setTid(e.target.value)} error={errors.transactionId} placeholder="e.g. 31234567890" />
          <Field label="Sent from (mobile number)" name="sender" value={sender} onChange={(e) => setSender(e.target.value)} error={errors.senderNumber} inputMode="tel" />
          <button disabled={pending} className={`${primaryBtn} sm:mt-6`}>
            {pending && <Loader2 className="size-4 animate-spin" />} Submit
          </button>
        </form>
      )}
    </section>
  );
}

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function cancel() {
    setPending(true);
    try {
      await api(`/api/orders/${orderNumber}/cancel`, { method: "POST" });
      toast.success("Order cancelled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return confirming ? (
    <div className="rounded-2xl border border-destructive/30 bg-red-50 p-4 text-sm">
      <p className="font-semibold text-red-900">Cancel this order?</p>
      <div className="mt-3 flex gap-2">
        <button onClick={cancel} disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-full bg-destructive px-4 font-semibold text-white disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />} Yes, cancel
        </button>
        <button onClick={() => setConfirming(false)} className="h-9 rounded-full border border-input bg-white px-4 font-semibold">Keep order</button>
      </div>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)} className="w-full rounded-full border border-input bg-white py-2.5 text-sm font-semibold text-destructive hover:bg-red-50">
      Cancel order
    </button>
  );
}
