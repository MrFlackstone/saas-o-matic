import {
  applyVat,
  calculateSimulationCost,
  computeUserTierLines,
} from './pricing-engine';
import type { CostComponent } from './types';

const ES_VAT_BPS = 2100;
const US_VAT_BPS = 0;

describe('computeUserTierLines', () => {
  const goldenCases: Array<[activeUsers: number, baseCents: number]> = [
    [1, 1000],
    [10, 10000],
    [11, 10800],
    [15, 14000],
    [50, 42000],
    [51, 42500],
    [100, 67000],
    [200, 117000],
  ];

  it.each(goldenCases)(
    '%i usuarios → base %i cts (RN-01)',
    (activeUsers, expectedBaseCents) => {
      const lines = computeUserTierLines(activeUsers);
      const baseCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
      expect(baseCents).toBe(expectedBaseCents);
    },
  );

  it('desglosa 15 usuarios en dos tramos', () => {
    expect(computeUserTierLines(15)).toEqual([
      {
        tier: 1,
        fromUser: 1,
        toUser: 10,
        users: 10,
        unitCents: 1000,
        amountCents: 10000,
      },
      {
        tier: 2,
        fromUser: 11,
        toUser: 15,
        users: 5,
        unitCents: 800,
        amountCents: 4000,
      },
    ]);
  });

  it('desglosa 200 usuarios en tres tramos, el último abierto', () => {
    expect(computeUserTierLines(200)).toEqual([
      {
        tier: 1,
        fromUser: 1,
        toUser: 10,
        users: 10,
        unitCents: 1000,
        amountCents: 10000,
      },
      {
        tier: 2,
        fromUser: 11,
        toUser: 50,
        users: 40,
        unitCents: 800,
        amountCents: 32000,
      },
      {
        tier: 3,
        fromUser: 51,
        toUser: 200,
        users: 150,
        unitCents: 500,
        amountCents: 75000,
      },
    ]);
  });

  it('0 usuarios → sin líneas', () => {
    expect(computeUserTierLines(0)).toEqual([]);
  });

  it('usuarios no enteros → error de dominio (invariante de céntimos enteros)', () => {
    expect(() => computeUserTierLines(5.5)).toThrow(
      'activeUsers must be an integer, got 5.5',
    );
  });

  it('NaN → error de dominio', () => {
    expect(() => computeUserTierLines(Number.NaN)).toThrow(
      'activeUsers must be an integer, got NaN',
    );
  });
});

describe('applyVat', () => {
  it('ES 21 % sobre 14000 cts → 2940 cts', () => {
    expect(applyVat(14000, ES_VAT_BPS)).toBe(2940);
  });

  it('US 0 % → 0 cts', () => {
    expect(applyVat(14000, US_VAT_BPS)).toBe(0);
  });

  it('redondea half-up las medias unidades (RN-02)', () => {
    expect(applyVat(50, 2100)).toBe(11);
  });
});

describe('calculateSimulationCost', () => {
  it('15 usuarios + ES → base 14000, tax 2940, total 16940', () => {
    expect(calculateSimulationCost({ activeUsers: 15 }, ES_VAT_BPS)).toEqual({
      lines: [
        {
          tier: 1,
          fromUser: 1,
          toUser: 10,
          users: 10,
          unitCents: 1000,
          amountCents: 10000,
        },
        {
          tier: 2,
          fromUser: 11,
          toUser: 15,
          users: 5,
          unitCents: 800,
          amountCents: 4000,
        },
      ],
      baseCents: 14000,
      vatRateBps: ES_VAT_BPS,
      taxCents: 2940,
      totalCents: 16940,
    });
  });

  it('15 usuarios + US → sin impuesto', () => {
    const result = calculateSimulationCost({ activeUsers: 15 }, US_VAT_BPS);
    expect(result.baseCents).toBe(14000);
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(14000);
  });

  it('0 usuarios → todo a cero sin reventar', () => {
    expect(calculateSimulationCost({ activeUsers: 0 }, ES_VAT_BPS)).toEqual({
      lines: [],
      baseCents: 0,
      vatRateBps: ES_VAT_BPS,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it('admite componentes de coste adicionales sin reescritura (ADR-07)', () => {
    const flatFeeComponent: CostComponent = () => [
      {
        tier: 0,
        fromUser: 0,
        toUser: 0,
        users: 0,
        unitCents: 500,
        amountCents: 500,
      },
    ];
    const result = calculateSimulationCost({ activeUsers: 1 }, ES_VAT_BPS, [
      flatFeeComponent,
    ]);
    expect(result.baseCents).toBe(500);
    expect(result.taxCents).toBe(105);
    expect(result.totalCents).toBe(605);
  });
});
