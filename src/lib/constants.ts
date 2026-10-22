export const SITE = {
  name: "BNB Book Outlet",
  tagline: "Matric & Intermediate books, delivered across Pakistan",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  email: "info@bnbbookoutlet.pk",
  supportEmail: "support@bnbbookoutlet.pk",
  phones: ["0300-0000000", "042-00000000"],
  address: "Urdu Bazar, Lahore, Punjab, Pakistan",
} as const;

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const CLASSES = [
  { value: 9, label: "Class 9", short: "9th", level: "MATRIC" },
  { value: 10, label: "Class 10", short: "10th", level: "MATRIC" },
  { value: 11, label: "Class 11 (1st Year)", short: "1st Year", level: "INTERMEDIATE" },
  { value: 12, label: "Class 12 (2nd Year)", short: "2nd Year", level: "INTERMEDIATE" },
] as const;

export function classLabel(classLevel: number) {
  return CLASSES.find((c) => c.value === classLevel)?.label ?? `Class ${classLevel}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING: "Payment pending",
  AWAITING_VERIFICATION: "Awaiting verification",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EASYPAISA: "Easypaisa (online)",
  EASYPAISA_MANUAL: "Manual Easypaisa transfer",
  COD: "Cash on Delivery",
};

export const SESSION_COOKIE = "bnb_session";
