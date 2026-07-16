import type { PricingTier } from './types'

export const PRICING_TIERS: readonly PricingTier[] = [
  { tier: 1, fromUser: 1, toUser: 10, unitCents: 1000 },
  { tier: 2, fromUser: 11, toUser: 50, unitCents: 800 },
  { tier: 3, fromUser: 51, toUser: null, unitCents: 500 },
]
