export const MONTHLY_INCOME_SOURCES = [
  { name: "LawDepot", amountCents: 5000 * 100 },
  { name: "LaundryWell", amountCents: 1500 * 100 },
  { name: "Condo rental", amountCents: 1700 * 100 },
  { name: "Nidhi", amountCents: 3960 * 100 },
] as const;

export const TOTAL_MONTHLY_INCOME_CENTS = MONTHLY_INCOME_SOURCES.reduce(
  (total, source) => total + source.amountCents,
  0,
);
