import { ExpenseCategory } from "@/lib/types";

/** Spending limit per category (whole cents). */
export const CATEGORY_BUDGET_CENTS: Record<ExpenseCategory, number> = {
  [ExpenseCategory.Grocery]: 1000 * 100,
  [ExpenseCategory.DhanMisc]: 400 * 100,
  [ExpenseCategory.NidhiMisc]: 400 * 100,
  [ExpenseCategory.EatingOut]: 600 * 100,
  [ExpenseCategory.Gas]: 200 * 100,
};
