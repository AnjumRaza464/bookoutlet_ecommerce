import { describe, expect, it } from "vitest";
import { buildQuote, effectivePrice, evaluateCoupon, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, type CouponLike } from "@/lib/pricing";

const book = (over: Partial<{ id: string; title: string; price: number; discountPercent: number; stock: number; isActive: boolean }> = {}) => ({
  id: "b1",
  title: "Physics 9",
  price: 500,
  discountPercent: 0,
  stock: 10,
  isActive: true,
  ...over,
});

const coupon = (over: Partial<CouponLike> = {}): CouponLike => ({
  code: "SAVE10",
  type: "PERCENT",
  value: 10,
  minOrder: 0,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  ...over,
});

describe("effectivePrice", () => {
  it("applies book discount and rounds to whole rupees", () => {
    expect(effectivePrice({ price: 455, discountPercent: 15 })).toBe(387); // 386.75
    expect(effectivePrice({ price: 500, discountPercent: 0 })).toBe(500);
  });
  it("clamps discount between 0 and 90%", () => {
    expect(effectivePrice({ price: 1000, discountPercent: 150 })).toBe(100);
    expect(effectivePrice({ price: 1000, discountPercent: -5 })).toBe(1000);
  });
});

describe("evaluateCoupon", () => {
  const now = new Date("2026-10-22T10:00:00Z");
  it("computes percent and fixed discounts", () => {
    expect(evaluateCoupon(coupon(), 2000, now)).toEqual({ ok: true, discount: 200 });
    expect(evaluateCoupon(coupon({ type: "FIXED", value: 300 }), 2000, now)).toEqual({ ok: true, discount: 300 });
  });
  it("never discounts more than the subtotal", () => {
    expect(evaluateCoupon(coupon({ type: "FIXED", value: 5000 }), 800, now)).toEqual({ ok: true, discount: 800 });
  });
  it("rejects inactive, expired, not-started, used-up and below-minimum coupons", () => {
    expect(evaluateCoupon(coupon({ isActive: false }), 2000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ endsAt: new Date("2026-10-01") }), 2000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ startsAt: new Date("2026-11-01") }), 2000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ maxUses: 5, usedCount: 5 }), 2000, now).ok).toBe(false);
    const r = evaluateCoupon(coupon({ minOrder: 3000 }), 2000, now);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining("3000") });
  });
  it("rejects a missing coupon", () => {
    expect(evaluateCoupon(null, 2000, now)).toEqual({ ok: false, reason: "Invalid coupon code" });
  });
});

describe("buildQuote", () => {
  it("totals lines and charges shipping below the free threshold", () => {
    const q = buildQuote([{ book: book(), quantity: 2 }], null);
    expect(q.subtotal).toBe(1000);
    expect(q.shippingFee).toBe(SHIPPING_FEE);
    expect(q.total).toBe(1000 + SHIPPING_FEE);
    expect(q.hasErrors).toBe(false);
  });
  it("gives free shipping at or above the threshold (after discounts)", () => {
    const q = buildQuote([{ book: book({ price: FREE_SHIPPING_THRESHOLD }), quantity: 1 }], null);
    expect(q.shippingFee).toBe(0);
    const withCoupon = buildQuote([{ book: book({ price: FREE_SHIPPING_THRESHOLD }), quantity: 1 }], coupon());
    expect(withCoupon.shippingFee).toBe(SHIPPING_FEE); // 3000 - 300 < threshold
  });
  it("flags out-of-stock, over-stock and inactive lines", () => {
    const q = buildQuote(
      [
        { book: book({ id: "a", stock: 0 }), quantity: 1 },
        { book: book({ id: "b", stock: 2 }), quantity: 3 },
        { book: book({ id: "c", isActive: false }), quantity: 1 },
      ],
      null,
    );
    expect(q.lines.map((l) => l.error)).toEqual(["Out of stock", "Only 2 left in stock", "This book is no longer available"]);
    expect(q.hasErrors).toBe(true);
  });
  it("caps quantity per line at 20 and floors fractional quantities", () => {
    const q = buildQuote([{ book: book({ stock: 100 }), quantity: 55.7 }], null);
    expect(q.lines[0].quantity).toBe(20);
  });
  it("reports coupon errors without applying a discount", () => {
    const q = buildQuote([{ book: book(), quantity: 1 }], coupon({ minOrder: 5000 }));
    expect(q.discountTotal).toBe(0);
    expect(q.couponError).toBeDefined();
    expect(q.couponCode).toBeUndefined();
  });
  it("has zero shipping for an empty cart", () => {
    expect(buildQuote([], null).total).toBe(0);
  });
});
