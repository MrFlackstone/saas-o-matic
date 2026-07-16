import { PRICING_TIERS } from './tiers';

describe('PRICING_TIERS — invariantes estructurales (RN-01)', () => {
  it('el primer tramo empieza en el usuario 1 y los tramos son contiguos', () => {
    expect(PRICING_TIERS[0].fromUser).toBe(1);
    for (let i = 1; i < PRICING_TIERS.length; i++) {
      const previousEnd = PRICING_TIERS[i - 1].toUser;
      expect(previousEnd).not.toBeNull();
      expect(PRICING_TIERS[i].fromUser).toBe((previousEnd as number) + 1);
    }
  });

  it('solo el último tramo es abierto', () => {
    const lastIndex = PRICING_TIERS.length - 1;
    PRICING_TIERS.forEach((tier, index) => {
      if (index === lastIndex) {
        expect(tier.toUser).toBeNull();
      } else {
        expect(tier.toUser).toBeGreaterThanOrEqual(tier.fromUser);
      }
    });
  });

  it('numeración consecutiva desde 1 y precios unitarios enteros positivos', () => {
    PRICING_TIERS.forEach((tier, index) => {
      expect(tier.tier).toBe(index + 1);
      expect(Number.isInteger(tier.unitCents)).toBe(true);
      expect(tier.unitCents).toBeGreaterThan(0);
    });
  });
});
