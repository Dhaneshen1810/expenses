import type { Metadata } from "next";
import { ExpensesView } from "./expenses-view";

export const metadata: Metadata = {
  title: "Expenses",
  description: "View and manage expenses.",
};

export default function ExpensesPage() {
  return <ExpensesView />;
}
