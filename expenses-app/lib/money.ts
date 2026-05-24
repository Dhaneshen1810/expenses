/** API amounts are whole cents; UI uses dollars. */
export const CENTS_PER_DOLLAR = 100;

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

export function centsToDollars(cents: number): number {
  return cents / CENTS_PER_DOLLAR;
}

/** Format cents as a currency amount (major units). Defaults to USD when `currency` is omitted. */
export function formatCentsAsCurrency(
  cents: number,
  currencyCode: string | undefined
): string {
  const code =
    typeof currencyCode === "string" && currencyCode.length > 0
      ? currencyCode
      : "USD";
  const major = centsToDollars(cents);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(major);
  } catch {
    return `${code} ${major.toFixed(2)}`;
  }
}
