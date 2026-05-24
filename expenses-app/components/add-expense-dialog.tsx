"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dollarsToCents } from "@/lib/money";
import {
  CARD_OWNER_LABELS,
  CARD_OWNER_OPTIONS,
  CardOwner,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
} from "@/lib/types";

/** YYYY-MM-DD string for a date-only input */
function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Encode picked calendar day as UTC midnight ISO (matches POST body shape). */
function dateInputToUtcIso(dateYmd: string): string {
  return `${dateYmd}T00:00:00.000Z`;
}

function parseFormError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return "Could not save expense";
}

interface AddExpenseDialogProps {
  onCreated: () => void;
}

export function AddExpenseDialog({ onCreated }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(
    ExpenseCategory.Grocery,
  );
  const [dateOnly, setDateOnly] = useState(() => toDateInputValue(new Date()));
  const [cardOwner, setCardOwner] = useState<CardOwner>(CardOwner.Dhan);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTitle("");
    setAmount("");
    setCategory(ExpenseCategory.Grocery);
    setDateOnly(toDateInputValue(new Date()));
    setCardOwner(CardOwner.Dhan);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const n = Number.parseFloat(amount);

    if (!trimmedTitle) {
      setFormError("Title is required.");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setFormError("Amount must be a positive dollar amount.");
      return;
    }
    const amountCents = dollarsToCents(n);
    if (amountCents < 1) {
      setFormError("Amount must be at least $0.01.");
      return;
    }
    if (!dateOnly) {
      setFormError("Date is required.");
      return;
    }

    const dateIso = dateInputToUtcIso(dateOnly);

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          amount: amountCents,
          category,
          date: dateIso,
          cardOwner,
        }),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = parseFormError(data);
        setFormError(msg);
        toast({
          title: "Could not add expense",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Expense added" });
      setOpen(false);
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setFormError(msg);
      toast({
        title: "Could not add expense",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add expense
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <DialogHeader>
              <DialogTitle>New expense</DialogTitle>
              <DialogDescription>
                Enter the details below. They are sent to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  POST /api/expenses
                </code>{" "}
                as JSON.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              {formError ? (
                <p
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="expense-title">Title</Label>
                <Input
                  id="expense-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Amazon"
                  autoComplete="off"
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter dollars; we send whole cents to the API.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ExpenseCategory)}
                  disabled={submitting}
                >
                  <SelectTrigger id="expense-category" className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {EXPENSE_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={dateOnly}
                  onChange={(e) => setDateOnly(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expense-card-owner">Card owner</Label>
                <Select
                  value={cardOwner}
                  onValueChange={(v) => setCardOwner(v as CardOwner)}
                  disabled={submitting}
                >
                  <SelectTrigger id="expense-card-owner" className="w-full">
                    <SelectValue placeholder="Card owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_OWNER_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {CARD_OWNER_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
