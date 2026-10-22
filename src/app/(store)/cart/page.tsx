import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-brand-black sm:text-4xl">Shopping cart</h1>
      <CartView />
    </div>
  );
}
