/**
 * Pure pricing logic. All amounts are whole PKR (integers).
 * This is the single source of truth used by the server when quoting carts and creating orders.
 */

export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_THRESHOLD = 3000;
export const MAX_QTY_PER_ITEM = 20;

export type PricedBook = { price: number; discountPercent: number };

export function effectivePrice(book: PricedBook) {
  const pct = Math.min(Math.max(book.discountPercent, 0), 90);
  return Math.round((book.price * (100 - pct)) / 100);
}

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type CouponResult = { ok: true; discount: number } | { ok: false; reason: string };

export function evaluateCoupon(coupon: CouponLike | null, subtotal: number, now = new Date()): CouponResult {
  if (!coupon || !coupon.isActive) return { ok: false, reason: "Invalid coupon code" };
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: "This coupon is not active yet" };
  if (coupon.endsAt && now > coupon.endsAt) return { ok: false, reason: "This coupon has expired" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, reason: "This coupon has reached its usage limit" };
  if (subtotal < coupon.minOrder)
    return { ok: false, reason: `Minimum order of Rs. ${coupon.minOrder} required for this coupon` };
  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * Math.min(coupon.value, 100)) / 100) : coupon.value;
  return { ok: true, discount: Math.max(0, Math.min(raw, subtotal)) };
}

export function shippingFor(amountAfterDiscount: number, itemCount: number) {
  if (itemCount === 0) return 0;
  return amountAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export type QuoteLineInput = { book: PricedBook & { id: string; title: string; stock: number; isActive: boolean }; quantity: number };

export type QuoteLine = {
  bookId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: number;
  error?: string;
};

export function buildQuote(lines: QuoteLineInput[], coupon: CouponLike | null, now = new Date()) {
  const quoteLines: QuoteLine[] = lines.map(({ book, quantity }) => {
    const unitPrice = effectivePrice(book);
    const qty = Math.max(1, Math.min(Math.floor(quantity), MAX_QTY_PER_ITEM));
    let error: string | undefined;
    if (!book.isActive) error = "This book is no longer available";
    else if (book.stock <= 0) error = "Out of stock";
    else if (qty > book.stock) error = `Only ${book.stock} left in stock`;
    return { bookId: book.id, title: book.title, unitPrice, quantity: qty, lineTotal: unitPrice * qty, available: book.stock, error };
  });
  const subtotal = quoteLines.reduce((s, l) => s + l.lineTotal, 0);
  let discountTotal = 0;
  let couponError: string | undefined;
  let couponCode: string | undefined;
  if (coupon !== undefined && coupon !== null) {
    const r = evaluateCoupon(coupon, subtotal, now);
    if (r.ok) {
      discountTotal = r.discount;
      couponCode = coupon.code;
    } else couponError = r.reason;
  }
  const itemCount = quoteLines.reduce((s, l) => s + l.quantity, 0);
  const shippingFee = shippingFor(subtotal - discountTotal, itemCount);
  const total = subtotal - discountTotal + shippingFee;
  return {
    lines: quoteLines,
    subtotal,
    discountTotal,
    couponCode,
    couponError,
    shippingFee,
    total,
    itemCount,
    hasErrors: quoteLines.some((l) => l.error),
  };
}

export type Quote = ReturnType<typeof buildQuote>;
