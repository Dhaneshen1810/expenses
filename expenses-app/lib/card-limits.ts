import { CardOwner } from "@/lib/types";

/** Monthly card limits in whole cents. */
export const CARD_LIMIT_CENTS: Record<CardOwner, number> = {
  [CardOwner.Dhan]: 6500 * 100,
  [CardOwner.Nidhi]: 3960 * 100,
};
