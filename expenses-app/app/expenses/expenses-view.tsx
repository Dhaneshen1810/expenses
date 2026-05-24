"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { AppShell } from "@/components/app-shell";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { normalizeExpensesPayload, sortExpensesNewestFirst } from "@/lib/expenses";
import { formatCentsAsCurrency } from "@/lib/money";
import { useToast } from "@/hooks/use-toast";
import {
  CARD_OWNER_LABELS,
  CardOwner,
  EXPENSE_CATEGORY_LABELS,
  ExpenseCategory,
  type Expense,
} from "@/lib/types";

function formatAmount(expense: Expense): string {
  if (expense.amount == null) return "—";
  const curr =
    typeof expense.currency === "string" && expense.currency.length > 0
      ? expense.currency
      : undefined;
  return formatCentsAsCurrency(expense.amount, curr);
}

function displayTitle(e: Expense): string {
  const t = e.title ?? e.description;
  return typeof t === "string" && t.length > 0 ? t : "—";
}

function displayCategory(raw: string | undefined): string {
  if (!raw) return "—";
  const vals = Object.values(ExpenseCategory) as string[];
  if (vals.includes(raw)) {
    return EXPENSE_CATEGORY_LABELS[raw as ExpenseCategory];
  }
  return raw;
}

function displayCardOwner(raw: string | undefined): string {
  if (!raw) return "—";
  const vals = Object.values(CardOwner) as string[];
  if (vals.includes(raw)) {
    return CARD_OWNER_LABELS[raw as CardOwner];
  }
  return raw;
}

/** MM/DD/YYYY; uses UTC calendar date so API ISO instants stay on the intended day. */
function formatExpenseDateMdY(raw: string | undefined): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function ExpensesView() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
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
      setExpenses(
        sortExpensesNewestFirst(normalizeExpensesPayload(data))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDeleteExpense() {
    if (!expenseToDelete) return;
    const id = expenseToDelete.id;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(
        `/api/expenses/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data: unknown = await res.json();
          if (
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
          ) {
            msg = (data as { error: string }).error;
          }
        } catch {
          /* ignore */
        }
        toast({
          title: "Could not delete expense",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Expense deleted" });
      setExpenseToDelete(null);
      await load();
    } catch (e) {
      toast({
        title: "Could not delete expense",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Expenses
          </h1>
          <AddExpenseDialog onCreated={() => void load()} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              All expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Spinner className="size-5" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : expenses.length === 0 ? (
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Wallet className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No expenses yet</EmptyTitle>
                  <EmptyDescription>
                    When your backend is wired, set{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      SERVER_URL
                    </code>{" "}
                    or{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      NEXT_PUBLIC_SERVER_URL
                    </code>{" "}
                    so this app can proxy to your API.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Card owner</TableHead>
                    <TableHead className="w-[52px] text-right">
                      <span className="sr-only">Delete</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {displayTitle(e)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {displayCategory(
                          typeof e.category === "string" ? e.category : undefined
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(e)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatExpenseDateMdY(e.date ?? e.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {displayCardOwner(
                          typeof e.cardOwner === "string" ? e.cardOwner : undefined
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${displayTitle(e)}`}
                          disabled={deleteSubmitting}
                          onClick={() => setExpenseToDelete(e)}
                        >
                          <X className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={expenseToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !deleteSubmitting) setExpenseToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
              <AlertDialogDescription>
                {expenseToDelete ? (
                  <>
                    This will permanently remove{" "}
                    <span className="font-medium text-foreground">
                      {displayTitle(expenseToDelete)}
                    </span>
                    . This cannot be undone.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteSubmitting}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteSubmitting}
                onClick={() => void confirmDeleteExpense()}
              >
                {deleteSubmitting ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
