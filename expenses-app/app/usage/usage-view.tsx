"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  filterExpensesInCurrentMonth,
  normalizeExpensesPayload,
} from "@/lib/expenses";
import {
  MONTHLY_INCOME_SOURCES,
  TOTAL_MONTHLY_INCOME_CENTS,
} from "@/lib/income";
import { formatCentsAsCurrency } from "@/lib/money";
import type { Expense } from "@/lib/types";
import { cn } from "@/lib/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function UsageView() {
  const { authFetch, status } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/expenses", {
        cache: "no-store",
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `Request failed (${response.status})`;
        setError(message);
        setExpenses([]);
        return;
      }

      setExpenses(normalizeExpensesPayload(data));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load expenses",
      );
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

  const monthlyExpenses = useMemo(
    () =>
      filterExpensesInCurrentMonth(expenses).reduce(
        (total, expense) =>
          total + (typeof expense.amount === "number" ? expense.amount : 0),
        0,
      ),
    [expenses],
  );
  const percentage =
    TOTAL_MONTHLY_INCOME_CENTS > 0
      ? (monthlyExpenses / TOTAL_MONTHLY_INCOME_CENTS) * 100
      : 0;
  const remainingIncome = TOTAL_MONTHLY_INCOME_CENTS - monthlyExpenses;
  const overIncome = percentage > 100;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Usage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This month&apos;s combined expenses as a percentage of combined
            monthly income (amounts in CAD).
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
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Expense-to-income usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div
                  className={cn(
                    "text-4xl font-semibold tabular-nums tracking-tight",
                    overIncome ? "text-destructive" : "text-foreground",
                  )}
                >
                  {percentage.toFixed(1)}%
                </div>

                <Progress
                  value={Math.min(100, percentage)}
                  className={cn(
                    "h-3",
                    overIncome &&
                      "**:data-[slot=progress-indicator]:bg-destructive!",
                  )}
                />

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Total expenses</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {formatCentsAsCurrency(monthlyExpenses, "CAD")}
                  </dd>
                  <dt className="text-muted-foreground">Total income</dt>
                  <dd className="text-right tabular-nums text-muted-foreground">
                    {formatCentsAsCurrency(TOTAL_MONTHLY_INCOME_CENTS, "CAD")}
                  </dd>
                  <dt className="text-muted-foreground">
                    {remainingIncome >= 0 ? "Income remaining" : "Over income"}
                  </dt>
                  <dd
                    className={cn(
                      "text-right font-medium tabular-nums",
                      remainingIncome >= 0
                        ? "text-foreground"
                        : "text-destructive",
                    )}
                  >
                    {formatCentsAsCurrency(Math.abs(remainingIncome), "CAD")}
                  </dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Monthly income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {MONTHLY_INCOME_SOURCES.map((source) => (
                    <div
                      key={source.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <dt className="text-muted-foreground">{source.name}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {formatCentsAsCurrency(source.amountCents, "CAD")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
