import type { Expense } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(r: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function pickNumber(r: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return undefined;
}

/** Coerce API payloads (array or wrapped) into Expense rows. */
export function normalizeExpensesPayload(data: unknown): Expense[] {
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (isRecord(data)) {
    const nested =
      data.expenses ?? data.data ?? data.items ?? data.results;
    if (Array.isArray(nested)) raw = nested;
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      return { id: `row-${index}`, description: String(item) };
    }
    const id =
      pickString(item, ["id", "uuid", "_id"]) ?? `row-${index}`;
    return {
      ...item,
      id,
      title: pickString(item, ["title"]),
      amount: pickNumber(item, ["amount", "value", "total"]),
      currency: pickString(item, ["currency", "curr"]),
      description: pickString(item, [
        "description",
        "memo",
        "note",
        "title",
        "name",
      ]),
      category: pickString(item, ["category", "type"]),
      date: pickString(item, ["date", "spentAt", "occurredAt", "createdAt"]),
      createdAt: pickString(item, ["createdAt"]),
      cardOwner: pickString(item, ["cardOwner", "card_owner", "owner"]),
    } as Expense;
  });
}

function parseExpenseTimeMs(e: Expense): number | null {
  const raw = e.date ?? e.createdAt;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

/** `YYYY-MM` from an ISO-like start (`YYYY-MM-DD…`), or null if not matched. */
function yearMonthFromIsoPrefix(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?/.exec(raw.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

/** Calendar `YYYY-MM` for an expense (`date`, then `createdAt`), local fallback for non-ISO strings. */
function expenseYearMonth(e: Expense): string | null {
  const raw = e.date ?? e.createdAt;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const fromPrefix = yearMonthFromIsoPrefix(raw);
  if (fromPrefix) return fromPrefix;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

/** Keep expenses whose calendar month matches `now` in the user's local timezone. */
export function filterExpensesInCurrentMonth(
  expenses: Expense[],
  now = new Date(),
): Expense[] {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const target = `${y}-${String(m).padStart(2, "0")}`;
  return expenses.filter((e) => expenseYearMonth(e) === target);
}

/** Newest first by `date`, then `createdAt`. Rows without a parseable date sink to the bottom. */
export function sortExpensesNewestFirst(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const ta = parseExpenseTimeMs(a);
    const tb = parseExpenseTimeMs(b);
    if (ta !== null && tb !== null) return tb - ta;
    if (ta !== null) return -1;
    if (tb !== null) return 1;
    return 0;
  });
}
