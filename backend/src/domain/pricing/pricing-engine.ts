import { PRICING_TIERS } from './tiers';
import type {
  CostComponent,
  PricingInput,
  PricingResult,
  TierLine,
} from './types';

export function computeUserTierLines(activeUsers: number): TierLine[] {
  if (!Number.isInteger(activeUsers)) {
    throw new Error(`activeUsers must be an integer, got ${activeUsers}`);
  }
  const lines: TierLine[] = [];
  for (const { tier, fromUser, toUser, unitCents } of PRICING_TIERS) {
    if (activeUsers < fromUser) {
      break;
    }
    const lastUser =
      toUser === null ? activeUsers : Math.min(toUser, activeUsers);
    const users = lastUser - fromUser + 1;
    lines.push({
      tier,
      fromUser,
      toUser: lastUser,
      users,
      unitCents,
      amountCents: users * unitCents,
    });
  }
  return lines;
}

export const userTiersComponent: CostComponent = (input) =>
  computeUserTierLines(input.activeUsers);

const DEFAULT_COMPONENTS: readonly CostComponent[] = [userTiersComponent];

// RN-02: redondeo half-up — Math.round lleva las medias unidades hacia arriba
// para importes positivos, únicos posibles en este dominio.
export function applyVat(baseCents: number, vatRateBps: number): number {
  return Math.round((baseCents * vatRateBps) / 10000);
}

export function calculateSimulationCost(
  input: PricingInput,
  vatRateBps: number,
  components: readonly CostComponent[] = DEFAULT_COMPONENTS,
): PricingResult {
  const lines = components.flatMap((component) => component(input));
  const baseCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const taxCents = applyVat(baseCents, vatRateBps);
  return {
    lines,
    baseCents,
    vatRateBps,
    taxCents,
    totalCents: baseCents + taxCents,
  };
}
