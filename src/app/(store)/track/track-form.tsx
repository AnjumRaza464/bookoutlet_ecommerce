"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Field, primaryBtn } from "@/components/common/field";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { OrderEvents, OrderProgress } from "@/components/common/order-timeline";
import { api, FetchError } from "@/lib/fetcher";
import { formatPKR } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

type Result = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  city: string;
  courier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  itemCount: number;
  events: { status: string; note: string | null; createdAt: string }[];
};

export function TrackForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setFields({});
    try {
      setResult(await api<Result>("/api/track", { body: { orderNumber, phone } }));
    } catch (err) {
      setResult(null);
      if (err instanceof FetchError && err.fields) setFields(err.fields);
      setError(err instanceof Error ? err.message : "Could not find your order");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-start" noValidate>
        <Field label="Order number" name="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="BNB-261022-ABCDE" error={fields.orderNumber} />
        <Field label="Mobile number" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" inputMode="tel" error={fields.phone} />
        <button disabled={pending} className={`${primaryBtn} sm:mt-6`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Track
        </button>
      </form>
      {error && !Object.keys(fields).length && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-900" role="alert">{error}</p>}
      {result && (
        <section className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{result.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">
                {result.itemCount} item(s) · {formatPKR(result.total)} · to {result.city} · {PAYMENT_METHOD_LABELS[result.paymentMethod]}
              </p>
            </div>
            <div className="flex gap-2">
              <OrderStatusBadge status={result.status} />
              <PaymentStatusBadge status={result.paymentStatus} />
            </div>
          </div>
          <OrderProgress status={result.status} />
          {result.trackingNumber && (
            <p className="rounded-lg bg-brand-cream px-4 py-3 text-sm">
              Courier: <strong>{result.courier}</strong> · Tracking no. <strong>{result.trackingNumber}</strong>
            </p>
          )}
          <OrderEvents events={result.events} />
        </section>
      )}
    </>
  );
}
