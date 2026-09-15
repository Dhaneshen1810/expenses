import type { Metadata } from "next";
import { UsageView } from "./usage-view";

export const metadata: Metadata = {
  title: "Usage",
  description: "This month's expenses as a percentage of combined income.",
};

export default function UsagePage() {
  return <UsageView />;
}
