import type { Metadata } from "next";
import { formatPKR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Store policies",
  description: "Shipping, returns and payment policies at BNB Book Outlet.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-4xl font-bold text-brand-black">Store policies</h1>
      <section id="shipping" className="mt-10 scroll-mt-48">
        <h2 className="text-2xl font-bold">Shipping & delivery</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>We deliver to all provinces and territories of Pakistan, including Gilgit-Baltistan and AJK.</li>
          <li>Delivery fee is {formatPKR(SHIPPING_FEE)} per order. Orders of {formatPKR(FREE_SHIPPING_THRESHOLD)} or more (after discounts) ship free.</li>
          <li>Orders are usually dispatched within 1–2 working days. Delivery takes 2–5 working days depending on your city.</li>
          <li>A tracking number is shared once your parcel is handed to the courier.</li>
        </ul>
      </section>
      <section id="returns" className="mt-10 scroll-mt-48">
        <h2 className="text-2xl font-bold">Returns & refunds</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Wrong, damaged or misprinted books can be returned within 7 days of delivery.</li>
          <li>Books must be unused and in their original condition.</li>
          <li>Refunds for prepaid orders are sent to the original Easypaisa account within 5–7 working days after inspection.</li>
        </ul>
      </section>
      <section id="payments" className="mt-10 scroll-mt-48">
        <h2 className="text-2xl font-bold">Payment methods</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong>Easypaisa (online):</strong> approve a payment request on your Easypaisa account; the order is confirmed after the payment is verified with Easypaisa.</li>
          <li><strong>Manual Easypaisa transfer:</strong> send the order total to our Easypaisa account and submit the transaction ID. Our team verifies it manually before confirming your order.</li>
          <li><strong>Cash on Delivery:</strong> pay the courier in cash when your parcel arrives.</li>
          <li>All prices are in Pakistani Rupees (PKR) and are calculated by our server at checkout.</li>
        </ul>
      </section>
    </div>
  );
}
