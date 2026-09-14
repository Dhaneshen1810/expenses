import type { Metadata } from "next";
import { CardUsageView } from "./card-usage-view";

export const metadata: Metadata = {
  title: "Card usage",
  description: "This month's card usage vs. card limits.",
};

export default function CardUsagePage() {
  return <CardUsageView />;
}
