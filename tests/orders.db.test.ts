/**
 * Integration tests against the real database (Neon). They create isolated fixtures and clean up after themselves.
 * Run with: npm run test:db
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const enabled = process.env.RUN_DB_TESTS === "1" && !!process.env.DATABASE_URL;

describe.skipIf(!enabled)("orders (database)", async () => {
  const { db } = await import("@/lib/db");
  const { cancelOrder, createOrder, quoteCart, reviewManualPayment, submitManualPayment } = await import("@/lib/orders");

  const tag = `t${Date.now().toString(36)}`;
  let userId = "";
  let adminId = "";
  let bookId = "";
  let ids = { category: "", board: "", subject: "", publisher: "" };
  const address = { fullName: "Test Customer", phone: "03001234567", line1: "House 1, Street 2", city: "Lahore", province: "Punjab" };

  beforeAll(async () => {
    const [category, board, subject, publisher] = await Promise.all([
      db.category.create({ data: { name: `Cat ${tag}`, slug: `cat-${tag}` } }),
      db.board.create({ data: { name: `Board ${tag}`, slug: `board-${tag}` } }),
      db.subject.create({ data: { name: `Subj ${tag}`, slug: `subj-${tag}` } }),
      db.publisher.create({ data: { name: `Pub ${tag}`, slug: `pub-${tag}` } }),
    ]);
    ids = { category: category.id, board: board.id, subject: subject.id, publisher: publisher.id };
    const book = await db.book.create({
      data: {
        title: `Test Book ${tag}`,
        slug: `test-book-${tag}`,
        sku: `SKU-${tag}`,
        level: "MATRIC",
        classLevel: 9,
        price: 1000,
        discountPercent: 10,
        stock: 3,
        categoryId: category.id,
        boardId: board.id,
        subjectId: subject.id,
        publisherId: publisher.id,
      },
    });
    bookId = book.id;
    userId = (await db.user.create({ data: { name: "Test", email: `${tag}@test.local`, passwordHash: "x" } })).id;
    adminId = (await db.user.create({ data: { name: "Admin", email: `${tag}-admin@test.local`, passwordHash: "x", role: "ADMIN" } })).id;
    await db.coupon.create({ data: { code: `T${tag.toUpperCase()}`, type: "FIXED", value: 100, maxUses: 1 } });
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { userId } });
    await db.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
    await db.book.deleteMany({ where: { id: bookId } });
    await db.coupon.deleteMany({ where: { code: `T${tag.toUpperCase()}` } });
    await db.category.deleteMany({ where: { id: ids.category } });
    await db.board.deleteMany({ where: { id: ids.board } });
    await db.subject.deleteMany({ where: { id: ids.subject } });
    await db.publisher.deleteMany({ where: { id: ids.publisher } });
  });

  it("quotes from database prices, not client input", async () => {
    const q = await quoteCart([{ bookId, quantity: 2 }]);
    expect(q.lines[0].unitPrice).toBe(900);
    expect(q.subtotal).toBe(1800);
    expect(q.shippingFee).toBe(250);
    expect(q.total).toBe(2050);
  });

  it("creates an order, reserves stock and applies a coupon once", async () => {
    const order = await createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 1 }], couponCode: `T${tag.toUpperCase()}`, paymentMethod: "COD", address });
    expect(order.total).toBe(900 - 100 + 250);
    expect((await db.book.findUniqueOrThrow({ where: { id: bookId } })).stock).toBe(2);
    await expect(
      createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 1 }], couponCode: `T${tag.toUpperCase()}`, paymentMethod: "COD", address }),
    ).rejects.toThrow(/usage limit/);
    expect((await db.book.findUniqueOrThrow({ where: { id: bookId } })).stock).toBe(2); // rolled back
  });

  it("refuses orders beyond available stock", async () => {
    await expect(createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 5 }], paymentMethod: "COD", address })).rejects.toThrow(/left in stock/);
  });

  it("never oversells under concurrent checkouts", async () => {
    const attempts = await Promise.allSettled(
      [1, 2, 3].map(() => createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 1 }], paymentMethod: "COD", address })),
    );
    const ok = attempts.filter((a) => a.status === "fulfilled").length;
    expect(ok).toBeLessThanOrEqual(2);
    const stock = (await db.book.findUniqueOrThrow({ where: { id: bookId } })).stock;
    expect(stock).toBe(2 - ok);
    expect(stock).toBeGreaterThanOrEqual(0);
  });

  it("restores stock when an order is cancelled (idempotently)", async () => {
    await db.book.update({ where: { id: bookId }, data: { stock: 5 } });
    const order = await createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 2 }], paymentMethod: "EASYPAISA_MANUAL", address });
    expect((await db.book.findUniqueOrThrow({ where: { id: bookId } })).stock).toBe(3);
    await cancelOrder(order.id, "test");
    await cancelOrder(order.id, "test again");
    expect((await db.book.findUniqueOrThrow({ where: { id: bookId } })).stock).toBe(5);
  });

  it("only marks manual transfers paid after staff approval", async () => {
    const order = await createOrder({ userId, email: "t@test.local", items: [{ bookId, quantity: 1 }], paymentMethod: "EASYPAISA_MANUAL", address });
    const tid = `${Date.now()}`.slice(-11);
    await submitManualPayment(order.id, tid, "03001234567");
    let o = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(o.paymentStatus).toBe("AWAITING_VERIFICATION");
    await expect(submitManualPayment(order.id, tid, "03001234567")).rejects.toThrow(/already been submitted/);
    await reviewManualPayment(o.payments[0].id, true, adminId);
    o = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(o.paymentStatus).toBe("PAID");
    expect(o.status).toBe("CONFIRMED");
    await expect(reviewManualPayment(o.payments[0].id, false, adminId)).rejects.toThrow(/already been reviewed/);
  });
});
