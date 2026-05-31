"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { sumSpendingByCategory } from "@/lib/analytics";
import { CATEGORY_BUDGET_CENTS } from "@/lib/category-budgets";
import {
  filterExpensesInCurrentMonth,
  normalizeExpensesPayload,
} from "@/lib/expenses";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
  type Expense,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function AnalyticsView() {
  const { authFetch, status } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/expenses", { cache: "no-store" });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`;
        setError(msg);
        setExpenses([]);
        return;
      }
      setExpenses(normalizeExpensesPayload(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (status === "authenticated") {
      void load();
    }
  }, [load, status]);

  const monthExpenses = useMemo(
    () => filterExpensesInCurrentMonth(expenses),
    [expenses],
  );
  const byCategory = sumSpendingByCategory(monthExpenses);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This month&apos;s spending by category vs. your limits (amounts in
            USD).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner className="size-5" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {EXPENSE_CATEGORY_OPTIONS.map((category) => {
              const spent = byCategory[category];
              const limit = CATEGORY_BUDGET_CENTS[category];
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const barValue = Math.min(100, pct);
              const over = pct > 100;
              const remaining = limit - spent;

              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      {EXPENSE_CATEGORY_LABELS[category]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Spent</dt>
                      <dd className="text-right font-medium tabular-nums text-foreground">
                        {formatCentsAsCurrency(spent, "USD")}
                      </dd>
                      <dt className="text-muted-foreground">Limit</dt>
                      <dd className="text-right tabular-nums text-muted-foreground">
                        {formatCentsAsCurrency(limit, "USD")}
                      </dd>
                      <dt className="text-muted-foreground">
                        {remaining >= 0 ? "Remaining" : "Over limit"}
                      </dt>
                      <dd
                        className={cn(
                          "text-right font-medium tabular-nums",
                          remaining >= 0
                            ? "text-foreground"
                            : "text-destructive"
                        )}
                      >
                        {formatCentsAsCurrency(Math.abs(remaining), "USD")}
                        {remaining < 0 ? (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            over
                          </span>
                        ) : null}
                      </dd>
                    </dl>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget used</span>
                        <span
                          className={cn(
                            "tabular-nums font-medium",
                            over ? "text-destructive" : "text-foreground"
                          )}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={barValue}
                        className={cn(
                          "h-2.5",
                          over &&
                            "[&_[data-slot=progress-indicator]]:!bg-destructive"
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
