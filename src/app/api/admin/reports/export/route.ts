import { handler, requireApiStaff } from "@/lib/api";
import { parseRange, pkDay, salesReport, toCsv } from "@/lib/reports";

/** CSV export of orders in a date range (staff only). */
export const GET = handler(async (req) => {
  await requireApiStaff();
  const sp = req.nextUrl.searchParams;
  const range = parseRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const report = await salesReport(range);
  const rows = [
    ["Order", "Date", "Customer", "City", "Province", "Status", "Payment method", "Payment status", "Items", "Subtotal", "Discount", "Delivery", "Total (PKR)"],
    ...report.orders.map((o) => [
      o.orderNumber,
      pkDay(o.createdAt),
      o.fullName,
      o.city,
      o.province,
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal,
      o.discountTotal,
      o.shippingFee,
      o.total,
    ]),
  ];
  return new Response("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bnb-sales-${pkDay(range.from)}-to-${pkDay(range.to)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
