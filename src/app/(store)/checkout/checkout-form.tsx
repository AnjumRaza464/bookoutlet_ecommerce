"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Loader2, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Field, SelectField, primaryBtn } from "@/components/common/field";
import { OrderSummary } from "@/components/cart/order-summary";
import { useQuote } from "@/components/cart/use-quote";
import { cart, useCart } from "@/lib/cart-store";
import { PROVINCES } from "@/lib/constants";
import { api, FetchError } from "@/lib/fetcher";
import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
};

type Method = "EASYPAISA" | "EASYPAISA_MANUAL" | "COD";

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", city: "", province: "Punjab", postalCode: "" };

export function CheckoutForm({
  addresses,
  initialCoupon,
  defaultContact,
  easypaisaOnline,
}: {
  addresses: Address[];
  initialCoupon: string;
  defaultContact: { fullName: string; phone: string };
  easypaisaOnline: boolean;
}) {
  const router = useRouter();
  const items = useCart();
  const [coupon] = useState(initialCoupon);
  const { quote, loading } = useQuote(items, coupon);
  const initial = addresses[0];
  const [selected, setSelected] = useState<string>(initial?.id ?? "new");
  const [form, setForm] = useState(
    initial
      ? { ...EMPTY, ...initial, line2: initial.line2 ?? "", postalCode: initial.postalCode ?? "" }
      : { ...EMPTY, ...defaultContact },
  );
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [method, setMethod] = useState<Method>(easypaisaOnline ? "EASYPAISA" : "EASYPAISA_MANUAL");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0 && !submitting) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link href="/books" className={`${primaryBtn} mt-6`}>
          Browse books
        </Link>
      </div>
    );
  }

  function pickAddress(id: string) {
    setSelected(id);
    const a = addresses.find((x) => x.id === id);
    setForm(a ? { ...EMPTY, ...a, line2: a.line2 ?? "", postalCode: a.postalCode ?? "" } : { ...EMPTY, ...defaultContact });
    setSaveAddress(!a);
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const { fullName, phone, line1, line2, city, province, postalCode } = form;
      const res = await api<{ orderNumber: string }>("/api/orders", {
        body: {
          items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
          couponCode: coupon,
          address: { fullName, phone, line1, line2, city, province, postalCode },
          saveAddress,
          paymentMethod: method,
          notes,
        },
      });
      cart.clear();
      toast.success(`Order ${res.orderNumber} placed`);
      router.push(`/account/orders/${res.orderNumber}?placed=1`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof FetchError) {
        if (err.status === 401) {
          router.push("/login?next=/checkout");
          return;
        }
        if (err.fields) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fields)) mapped[k.replace(/^address\./, "")] = v;
          setErrors(mapped);
        }
      }
      toast.error(err instanceof Error ? err.message : "Could not place order");
    }
  }

  const methods: { id: Method; title: string; desc: string; Icon: typeof Wallet; disabled?: boolean; badge?: string }[] = [
    {
      id: "EASYPAISA",
      title: "Easypaisa (pay online)",
      desc: easypaisaOnline
        ? "Approve the payment request on your Easypaisa app or USSD prompt. Verified instantly."
        : "Currently unavailable — online Easypaisa payments have not been activated for this store yet.",
      Icon: Smartphone,
      disabled: !easypaisaOnline,
      badge: easypaisaOnline ? "Instant" : "Unavailable",
    },
    {
      id: "EASYPAISA_MANUAL",
      title: "Manual Easypaisa transfer",
      desc: "Send the amount to our Easypaisa account yourself, then submit the transaction ID (TID). We confirm your order after verifying the transfer — this is not an automatic payment.",
      Icon: Wallet,
      badge: "Manual verification",
    },
    { id: "COD", title: "Cash on Delivery", desc: "Pay in cash when your books arrive.", Icon: Banknote },
  ];

  return (
    <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Delivery address</h2>
          {addresses.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <label key={a.id} className={cn("cursor-pointer rounded-xl border p-4 text-sm", selected === a.id ? "border-brand-caramel bg-brand-cream" : "border-border")}>
                  <input type="radio" name="addr" className="sr-only" checked={selected === a.id} onChange={() => pickAddress(a.id)} />
                  <span className="font-semibold">{a.fullName}</span> {a.isDefault && <span className="text-xs text-brand-caramel">(default)</span>}
                  <span className="block text-muted-foreground">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.province}
                  </span>
                  <span className="block text-muted-foreground">{a.phone}</span>
                </label>
              ))}
              <label className={cn("grid cursor-pointer place-items-center rounded-xl border border-dashed p-4 text-sm font-semibold", selected === "new" ? "border-brand-caramel bg-brand-cream" : "border-border")}>
                <input type="radio" name="addr" className="sr-only" checked={selected === "new"} onChange={() => pickAddress("new")} />+ Use a new address
              </label>
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="fullName" value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" required />
            <Field label="Mobile number" name="phone" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="03001234567" inputMode="tel" autoComplete="tel" required />
            <Field label="House / street address" name="line1" value={form.line1} onChange={set("line1")} error={errors.line1} className="sm:col-span-2" autoComplete="address-line1" required />
            <Field label="Area / landmark (optional)" name="line2" value={form.line2} onChange={set("line2")} error={errors.line2} className="sm:col-span-2" autoComplete="address-line2" />
            <Field label="City" name="city" value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" required />
            <SelectField label="Province / territory" name="province" value={form.province} onChange={set("province")} error={errors.province} options={PROVINCES} />
            <Field label="Postal code (optional)" name="postalCode" value={form.postalCode} onChange={set("postalCode")} error={errors.postalCode} inputMode="numeric" maxLength={5} autoComplete="postal-code" />
          </div>
          {selected === "new" && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-[#4a2c1a]" />
              Save this address to my account
            </label>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Payment method</h2>
          <div className="mt-4 space-y-3" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex gap-4 rounded-xl border p-4",
                  m.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  method === m.id ? "border-brand-caramel bg-brand-cream" : "border-border",
                )}
              >
                <input type="radio" name="method" value={m.id} checked={method === m.id} disabled={m.disabled} onChange={() => setMethod(m.id)} className="mt-1 size-4 accent-[#4a2c1a]" />
                <m.Icon className="mt-0.5 size-6 shrink-0 text-brand-brown" />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {m.title}
                    {m.badge && <span className="rounded-full bg-brand-black/5 px-2 py-0.5 text-[11px] font-semibold text-brand-brown">{m.badge}</span>}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <label htmlFor="notes" className="text-xl font-bold">
            Order notes <span className="text-sm font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Delivery instructions, preferred time, etc."
            className="mt-3 w-full rounded-lg border border-input bg-white p-3 text-sm outline-none focus:border-brand-caramel"
          />
        </section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-44 lg:self-start">
        <OrderSummary quote={quote} loading={loading}>
          {quote && (
            <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto border-t border-border pt-4 text-sm">
              {quote.lines.map((l) => (
                <li key={l.bookId} className="flex justify-between gap-3">
                  <span className="line-clamp-1">
                    {l.quantity} × {l.title}
                  </span>
                  <span className="shrink-0">{formatPKR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
          {quote?.couponError && <p className="mt-3 text-xs text-destructive">Coupon: {quote.couponError}</p>}
          {quote?.hasErrors && (
            <p className="mt-3 text-sm text-destructive">
              Some items are unavailable. <Link href="/cart" className="underline">Review your cart</Link>.
            </p>
          )}
          <button type="submit" disabled={submitting || !quote || quote.hasErrors || !!quote.couponError} className={`${primaryBtn} mt-5 w-full`}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {method === "COD" ? "Place order" : "Place order & pay"}
            {quote && ` · ${formatPKR(quote.total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            By placing your order you agree to our <Link href="/policies" className="underline">store policies</Link>.
          </p>
        </OrderSummary>
      </div>
    </form>
  );
}
