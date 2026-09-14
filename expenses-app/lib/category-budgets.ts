import { ExpenseCategory } from "@/lib/types";

/** Spending limit per category (whole cents). */
export const CATEGORY_BUDGET_CENTS: Record<ExpenseCategory, number> = {
  [ExpenseCategory.Grocery]: 1000 * 100,
  [ExpenseCategory.DhanMisc]: 400 * 100,
  [ExpenseCategory.NidhiMisc]: 400 * 100,
  [ExpenseCategory.EatingOut]: 600 * 100,
  [ExpenseCategory.Gas]: 200 * 100,
  [ExpenseCategory.GasWaterElectricity]: 350 * 100,
  [ExpenseCategory.Insurance]: 561 * 100,
  [ExpenseCategory.Telus]: 128 * 100,
  [ExpenseCategory.CondoFee]: 426 * 100,
  [ExpenseCategory.Mortgages]: 3966 * 100,
  [ExpenseCategory.DhanStudLoans]: 296 * 100,
  [ExpenseCategory.Subscriptions]: 85 * 100,
  [ExpenseCategory.MartialArts]: 142 * 100,
  [ExpenseCategory.LifeInsurance]: 220 * 100,
  [ExpenseCategory.PetInsurance]: 115 * 100,
  [ExpenseCategory.DisabilityInsurance]: 156 * 100,
};
