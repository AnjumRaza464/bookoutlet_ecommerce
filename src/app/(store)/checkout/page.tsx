import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEasypaisaConfigured } from "@/lib/easypaisa";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ coupon?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const { coupon } = await searchParams;
  const user = await requireUser(`/checkout${coupon ? `?coupon=${encodeURIComponent(coupon)}` : ""}`);
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: { id: true, fullName: true, phone: true, line1: true, line2: true, city: true, province: true, postalCode: true, isDefault: true },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-brand-black sm:text-4xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      <CheckoutForm
        addresses={addresses}
        initialCoupon={coupon?.toUpperCase() ?? ""}
        defaultContact={{ fullName: user.name, phone: user.phone ?? "" }}
        easypaisaOnline={isEasypaisaConfigured()}
      />
    </div>
  );
}
