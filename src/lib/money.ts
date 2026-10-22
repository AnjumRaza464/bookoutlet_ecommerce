const formatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Formats whole rupees, e.g. 1250 -> "Rs. 1,250" */
export function formatPKR(amount: number) {
  return `Rs. ${formatter.format(Math.round(amount))}`;
}
