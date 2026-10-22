import { db } from "@/lib/db";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { CouponManager } from "./coupon-manager";

export const metadata = { title: "Discounts & coupons" };

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminHeader
        title="Discounts & coupons"
        description="Coupon codes apply at checkout and are validated on the server. For per-book discounts, set the discount % on the book itself (Books or Inventory)."
      />
      <Panel>
        <CouponManager
          coupons={coupons.map((c) => ({
            ...c,
            startsAt: c.startsAt?.toISOString() ?? null,
            endsAt: c.endsAt?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </Panel>
    </>
  );
}
