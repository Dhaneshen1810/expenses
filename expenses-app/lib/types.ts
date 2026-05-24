/** Shared with the API / form for new expenses. */
export enum ExpenseCategory {
  Grocery = "Grocery",
  EatingOut = "EatingOut",
  Gas = "Gas",
  DhanMisc = "DhanMisc",
  NidhiMisc = "NidhiMisc",
}

export const EXPENSE_CATEGORY_OPTIONS = Object.values(ExpenseCategory);

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.Grocery]: "Grocery",
  [ExpenseCategory.EatingOut]: "Eating out",
  [ExpenseCategory.Gas]: "Gas",
  [ExpenseCategory.DhanMisc]: "Dhan misc",
  [ExpenseCategory.NidhiMisc]: "Nidhi misc",
};

export enum CardOwner {
  Dhan = "Dhan",
  Nidhi = "Nidhi",
}

export const CARD_OWNER_OPTIONS = Object.values(CardOwner);

export const CARD_OWNER_LABELS: Record<CardOwner, string> = {
  [CardOwner.Dhan]: "Dhan",
  [CardOwner.Nidhi]: "Nidhi",
};

/** Normalized expense row; extra fields from your API are preserved via index signature. */
export interface Expense {
  id: string;
  title?: string;
  /** Whole cents (minor units); display as dollars (or major units) in the UI. */
  amount?: number;
  currency?: string;
  description?: string;
  category?: string;
  date?: string;
  createdAt?: string;
  cardOwner?: string;
  [key: string]: unknown;
}

export interface CreateExpensePayload {
  title: string;
  /** Whole cents */
  amount: number;
  category: ExpenseCategory;
  /** ISO 8601 instant (calendar date encoded as UTC midnight, e.g. 2026-04-15T00:00:00.000Z) */
  date: string;
  cardOwner: CardOwner;
}
