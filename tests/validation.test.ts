import { describe, expect, it } from "vitest";
import { addressSchema, checkoutSchema, couponSchema, manualPaymentSchema, normalizePkMobile, registerSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

describe("normalizePkMobile", () => {
  it.each([
    ["03001234567", "03001234567"],
    ["0300-1234567", "03001234567"],
    ["+92 300 1234567", "03001234567"],
    ["923001234567", "03001234567"],
    ["00923001234567", "03001234567"],
  ])("accepts %s", (input, expected) => expect(normalizePkMobile(input)).toBe(expected));

  it.each(["0421234567", "0300123456", "03001234567890", "abc", "05001234567"])("rejects %s", (input) => expect(normalizePkMobile(input)).toBeNull());
});

describe("addressSchema", () => {
  const valid = { fullName: "Ali Khan", phone: "0300 1234567", line1: "House 12, Street 4", city: "Lahore", province: "Punjab", postalCode: "54000" };
  it("accepts a Pakistani address and normalises the phone", () => {
    const r = addressSchema.parse(valid);
    expect(r.phone).toBe("03001234567");
  });
  it("rejects unknown provinces and bad postal codes", () => {
    expect(addressSchema.safeParse({ ...valid, province: "Texas" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, postalCode: "5400" }).success).toBe(false);
  });
  it("allows empty optional fields", () => {
    expect(addressSchema.safeParse({ ...valid, postalCode: "", line2: "" }).success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  const address = { fullName: "Ali Khan", phone: "03001234567", line1: "House 12, Street 4", city: "Lahore", province: "Punjab" };
  it("rejects empty carts, bad quantities and unknown payment methods", () => {
    expect(checkoutSchema.safeParse({ items: [], address, paymentMethod: "COD" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ items: [{ bookId: "x", quantity: 0 }], address, paymentMethod: "COD" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ items: [{ bookId: "x", quantity: 1 }], address, paymentMethod: "CARD" }).success).toBe(false);
  });
  it("ignores any client-supplied price fields", () => {
    const r = checkoutSchema.parse({ items: [{ bookId: "x", quantity: 1, price: 1 }], address, paymentMethod: "COD", total: 1 });
    expect(r.items[0]).toEqual({ bookId: "x", quantity: 1 });
    expect("total" in r).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires a letter and a number in the password", () => {
    const base = { name: "Sara", email: "SARA@Example.com", phone: "03111234567" };
    expect(registerSchema.safeParse({ ...base, password: "abcdefgh" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "12345678" }).success).toBe(false);
    const ok = registerSchema.parse({ ...base, password: "books2026" });
    expect(ok.email).toBe("sara@example.com");
  });
});

describe("manualPaymentSchema", () => {
  it("validates TID format", () => {
    expect(manualPaymentSchema.safeParse({ transactionId: "31234567890", senderNumber: "03001234567" }).success).toBe(true);
    expect(manualPaymentSchema.safeParse({ transactionId: "12", senderNumber: "03001234567" }).success).toBe(false);
    expect(manualPaymentSchema.safeParse({ transactionId: "abc def; drop", senderNumber: "03001234567" }).success).toBe(false);
  });
});

describe("couponSchema", () => {
  it("rejects percent coupons above 100", () => {
    expect(couponSchema.safeParse({ code: "BIG", type: "PERCENT", value: 120 }).success).toBe(false);
    expect(couponSchema.safeParse({ code: "BIG", type: "FIXED", value: 120 }).success).toBe(true);
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Physics Textbook 1st Year (Class 11) — Punjab")).toBe("physics-textbook-1st-year-class-11-punjab");
    expect(slugify("Guides & Keybooks")).toBe("guides-and-keybooks");
  });
});
