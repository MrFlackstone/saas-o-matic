export interface TierLine {
  tier: number;
  fromUser: number;
  toUser: number;
  users: number;
  unitCents: number;
  amountCents: number;
}

export interface PricingTier {
  tier: number;
  fromUser: number;
  toUser: number | null;
  unitCents: number;
}

export interface PricingInput {
  activeUsers: number;
}

export type CostComponent = (input: PricingInput) => TierLine[];

export interface PricingResult {
  lines: TierLine[];
  baseCents: number;
  vatRateBps: number;
  taxCents: number;
  totalCents: number;
}
