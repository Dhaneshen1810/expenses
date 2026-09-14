"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { CARD_LIMIT_CENTS } from "@/lib/card-limits";
import {
  filterExpensesInCurrentMonth,
  normalizeExpensesPayload,
} from "@/lib/expenses";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  CARD_OWNER_LABELS,
  CARD_OWNER_OPTIONS,
  type CardOwner,
  type Expense,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sumSpendingByCard(expenses: Expense[]): Record<CardOwner, number> {
  const totals = Object.fromEntries(
    CARD_OWNER_OPTIONS.map((owner) => [owner, 0]),
  ) as Record<CardOwner, number>;

  for (const expense of expenses) {
    const owner = expense.cardOwner;
    if (
      typeof owner === "string" &&
      CARD_OWNER_OPTIONS.includes(owner as CardOwner)
    ) {
      totals[owner as CardOwner] +=
        typeof expense.amount === "number" ? expense.amount : 0;
    }
  }

  return totals;
}

export function CardUsageView() {
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

  const monthlyTotals = useMemo(
    () => sumSpendingByCard(filterExpensesInCurrentMonth(expenses)),
    [expenses],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Card usage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This month&apos;s card spending vs. each card&apos;s limit (amounts
            in CAD).
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
            {CARD_OWNER_OPTIONS.map((owner) => {
              const used = monthlyTotals[owner];
              const limit = CARD_LIMIT_CENTS[owner];
              const percentage = limit > 0 ? (used / limit) * 100 : 0;
              const overLimit = percentage > 100;
              const remaining = limit - used;

              return (
                <Card key={owner}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      {CARD_OWNER_LABELS[owner]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Used</dt>
                      <dd className="text-right font-medium tabular-nums text-foreground">
                        {formatCentsAsCurrency(used, "CAD")}
                      </dd>
                      <dt className="text-muted-foreground">Card limit</dt>
                      <dd className="text-right tabular-nums text-muted-foreground">
                        {formatCentsAsCurrency(limit, "CAD")}
                      </dd>
                      <dt className="text-muted-foreground">
                        {remaining >= 0 ? "Available" : "Over limit"}
                      </dt>
                      <dd
                        className={cn(
                          "text-right font-medium tabular-nums",
                          remaining >= 0
                            ? "text-foreground"
                            : "text-destructive",
                        )}
                      >
                        {formatCentsAsCurrency(Math.abs(remaining), "CAD")}
                      </dd>
                    </dl>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Card limit used</span>
                        <span
                          className={cn(
                            "tabular-nums font-medium",
                            overLimit ? "text-destructive" : "text-foreground",
                          )}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, percentage)}
                        className={cn(
                          "h-2.5",
                          overLimit &&
                            "**:data-[slot=progress-indicator]:bg-destructive!",
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
