import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { AddressBook, PasswordForm, ProfileForm } from "./account-forms";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, addresses] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-brand-brown hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You haven&apos;t placed any orders yet. <Link href="/books" className="font-semibold text-brand-brown underline">Start shopping</Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-brand-brown">
                  <span className="font-semibold">{o.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">{o.createdAt.toLocaleDateString("en-PK")}</span>
                  <span className="flex gap-2">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </span>
                  <span className="font-semibold">{formatPKR(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <ProfileForm initial={{ name: user.name, phone: user.phone ?? "" }} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Change password</h2>
          <PasswordForm />
        </section>
      </div>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Saved addresses</h2>
        <AddressBook addresses={addresses.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />
      </section>
    </div>
  );
}
