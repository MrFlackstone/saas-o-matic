import { describe, expect, it } from 'vitest'
import { applyVat, calculateSimulationCost, computeUserTierLines } from './pricing-engine'

// Casos dorados de RN-01: misma tabla que backend/src/domain/pricing (ADR-08).
const GOLDEN_BASE_CASES: ReadonlyArray<[activeUsers: number, baseCents: number]> = [
  [1, 1_000],
  [10, 10_000],
  [11, 10_800],
  [15, 14_000],
  [50, 42_000],
  [51, 42_500],
  [100, 67_000],
  [200, 117_000],
]

describe('calculateSimulationCost — casos dorados RN-01', () => {
  it.each(GOLDEN_BASE_CASES)(
    '%i usuarios → base de %i céntimos',
    (activeUsers, baseCents) => {
      const result = calculateSimulationCost({ activeUsers }, 0)
      expect(result.baseCents).toBe(baseCents)
      expect(result.taxCents).toBe(0)
      expect(result.totalCents).toBe(baseCents)
    },
  )

  it('15 usuarios con IVA ES 21 % → 169,40 € totales', () => {
    const result = calculateSimulationCost({ activeUsers: 15 }, 2100)
    expect(result.baseCents).toBe(14_000)
    expect(result.taxCents).toBe(2_940)
    expect(result.totalCents).toBe(16_940)
  })

  it('desglosa 15 usuarios en dos tramos', () => {
    expect(computeUserTierLines(15)).toEqual([
      { tier: 1, fromUser: 1, toUser: 10, users: 10, unitCents: 1_000, amountCents: 10_000 },
      { tier: 2, fromUser: 11, toUser: 15, users: 5, unitCents: 800, amountCents: 4_000 },
    ])
  })

  it('rechaza activeUsers no entero', () => {
    expect(() => computeUserTierLines(2.5)).toThrow('integer')
  })

  // RN-02: half-up — espejo del test del backend para que la réplica no diverja.
  it('redondea el IVA half-up sobre medias unidades', () => {
    expect(applyVat(50, 2100)).toBe(11)
    expect(applyVat(25, 2100)).toBe(5)
  })
})
