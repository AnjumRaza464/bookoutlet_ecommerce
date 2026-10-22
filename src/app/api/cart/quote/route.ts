import { handler, json, limit, parseJson } from "@/lib/api";
import { quoteCart } from "@/lib/orders";
import { quoteSchema } from "@/lib/validation";

/** Server-side cart pricing: current prices, stock checks, coupon and shipping. */
export const POST = handler(async (req) => {
  limit(req, "quote", 60);
  const { items, couponCode } = await parseJson(req, quoteSchema);
  const quote = await quoteCart(items, couponCode || null);
  return json(quote);
});
