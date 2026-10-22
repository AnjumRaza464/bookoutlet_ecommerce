import { z } from "zod";
import { PROVINCES } from "./constants";

/** Normalises Pakistani mobile numbers to 03XXXXXXXXX. Returns null when invalid. */
export function normalizePkMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+92|0092|92|0)?(3\d{9})$/);
  return m ? `0${m[1]}` : null;
}

export const pkMobile = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizePkMobile(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Pakistani mobile number (e.g. 03001234567)" });
      return z.NEVER;
    }
    return n;
  });

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email,
  phone: pkMobile,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone: pkMobile,
  line1: z.string().trim().min(5, "Street address is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(60),
  province: z.enum(PROVINCES, { message: "Select a province" }),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Postal code must be 5 digits")
    .optional()
    .or(z.literal("")),
});

export const cartItemsSchema = z
  .array(
    z.object({
      bookId: z.string().min(1).max(40),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .max(50, "Too many items in cart");

export const quoteSchema = z.object({
  items: cartItemsSchema,
  couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  items: cartItemsSchema.min(1, "Your cart is empty"),
  couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(["EASYPAISA", "EASYPAISA_MANUAL", "COD"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const manualPaymentSchema = z.object({
  transactionId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,20}$/, "Enter the Easypaisa transaction ID (TID) from your confirmation SMS"),
  senderNumber: pkMobile,
});

export const easypaisaInitiateSchema = z.object({
  mobileAccountNo: pkMobile,
});

export const bookSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and dashes")
    .max(100)
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(5000).default(""),
  author: z.string().trim().max(120).optional().or(z.literal("")),
  isbn: z.string().trim().max(20).optional().or(z.literal("")),
  sku: z.string().trim().min(2).max(40),
  classLevel: z.coerce.number().int().min(9).max(12),
  medium: z.enum(["English", "Urdu", "Bilingual"]).default("English"),
  edition: z.string().trim().max(60).optional().or(z.literal("")),
  pages: z.coerce.number().int().min(1).max(5000).optional().or(z.literal("")),
  coverImage: z.url("Cover image must be a full https:// URL").startsWith("https://").optional().or(z.literal("")),
  price: z.coerce.number().int().min(1, "Price must be at least Rs. 1").max(100000),
  discountPercent: z.coerce.number().int().min(0).max(90).default(0),
  stock: z.coerce.number().int().min(0).max(100000),
  lowStockAlert: z.coerce.number().int().min(0).max(1000).default(5),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1, "Select a category"),
  boardId: z.string().min(1, "Select a board"),
  subjectId: z.string().min(1, "Select a subject"),
  publisherId: z.string().min(1, "Select a publisher"),
});

export const bookPatchSchema = z
  .object({
    price: z.coerce.number().int().min(1).max(100000),
    discountPercent: z.coerce.number().int().min(0).max(90),
    stock: z.coerce.number().int().min(0).max(100000),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
  })
  .partial();

export const taxonomySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100)
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  province: z.string().trim().max(60).optional().or(z.literal("")),
  website: z.url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Code must be 3–30 letters, numbers, dashes or underscores"),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().min(1),
    minOrder: z.coerce.number().int().min(0).default(0),
    maxUses: z.coerce.number().int().min(1).optional().or(z.literal("")),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "PERCENT" || c.value <= 100, { message: "Percent discount cannot exceed 100", path: ["value"] });

export const orderUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PENDING", "AWAITING_VERIFICATION", "PAID", "FAILED", "REFUNDED"]).optional(),
  courier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  note: z.string().trim().max(500).optional(),
});

export const trackSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(5).max(30),
  phone: pkMobile,
});

export const newsletterSchema = z.object({ email });

export function firstError(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? issue.message : "Invalid input";
}

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
