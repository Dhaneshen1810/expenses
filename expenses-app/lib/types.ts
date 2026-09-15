/** Shared with the API / form for new expenses. */
export enum ExpenseCategory {
  Grocery = "Grocery",
  EatingOut = "EatingOut",
  Gas = "Gas",
  GasWaterElectricity = "GasWaterElectricity",
  Insurance = "Insurance",
  Telus = "Telus",
  PhoneBill = "PhoneBill",
  CondoFee = "CondoFee",
  Mortgages = "Mortgages",
  DhanStudLoans = "DhanStudLoans",
  NidhiStudLoans = "NidhiStudLoans",
  Subscriptions = "Subscriptions",
  MartialArts = "MartialArts",
  LifeInsurance = "LifeInsurance",
  PetInsurance = "PetInsurance",
  DisabilityInsurance = "DisabilityInsurance",
  PropertyTax = "PropertyTax",
  DhanMisc = "DhanMisc",
  NidhiMisc = "NidhiMisc",
}

export const EXPENSE_CATEGORY_OPTIONS = Object.values(ExpenseCategory);

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.Grocery]: "Grocery",
  [ExpenseCategory.EatingOut]: "Eating out",
  [ExpenseCategory.Gas]: "Gas",
  [ExpenseCategory.GasWaterElectricity]: "Gas/Water/Electricity",
  [ExpenseCategory.Insurance]: "Insurance",
  [ExpenseCategory.Telus]: "Telus",
  [ExpenseCategory.PhoneBill]: "Phone bill",
  [ExpenseCategory.CondoFee]: "Condo fee",
  [ExpenseCategory.Mortgages]: "Mortgages",
  [ExpenseCategory.DhanStudLoans]: "Dhan_stud_loans",
  [ExpenseCategory.NidhiStudLoans]: "Nidhi student loans",
  [ExpenseCategory.Subscriptions]: "Subscriptions",
  [ExpenseCategory.MartialArts]: "Martial arts",
  [ExpenseCategory.LifeInsurance]: "life_insurance",
  [ExpenseCategory.PetInsurance]: "Pet_insurance",
  [ExpenseCategory.DisabilityInsurance]: "Disability_insurance",
  [ExpenseCategory.PropertyTax]: "Property tax",
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
