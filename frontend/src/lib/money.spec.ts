import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

const NBSP = '\u00a0'

describe('formatMoney', () => {
  it('formatea céntimos EUR sin conversión', () => {
    expect(formatMoney(16_940, 'EUR', 1)).toBe(`169,40${NBSP}€`)
  })

  it('aplica la tasa de cambio antes de formatear', () => {
    expect(formatMoney(14_000, 'USD', 1.08)).toBe(`151,20${NBSP}US$`)
  })

  it('formatea JPY sin decimales (via Intl)', () => {
    expect(formatMoney(14_000, 'JPY', 162.37)).toBe(`22.732${NBSP}JPY`)
  })

  it('formatea cero', () => {
    expect(formatMoney(0, 'EUR', 1)).toBe(`0,00${NBSP}€`)
  })
})
