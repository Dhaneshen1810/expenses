import type { Expense } from "@/lib/types";
import { ExpenseCategory, EXPENSE_CATEGORY_OPTIONS } from "@/lib/types";

const KNOWN = new Set<string>(EXPENSE_CATEGORY_OPTIONS);

/** Sum amounts (cents) per known category; unknown categories are ignored. */
export function sumSpendingByCategory(expenses: Expense[]): Record<
  ExpenseCategory,
  number
> {
  const sums = Object.fromEntries(
    EXPENSE_CATEGORY_OPTIONS.map((c) => [c, 0])
  ) as Record<ExpenseCategory, number>;

  for (const e of expenses) {
    const c = e.category;
    if (typeof c !== "string" || !KNOWN.has(c)) continue;
    const cents = typeof e.amount === "number" && !Number.isNaN(e.amount) ? e.amount : 0;
    sums[c as ExpenseCategory] += cents;
  }

  return sums;
}
