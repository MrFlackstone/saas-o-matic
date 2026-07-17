import { describe, expect, it } from 'vitest'
import { simulatorFormSchema } from './simulator-form-schema'

const VALID = { activeUsers: 15, storageGb: 500, apiCallsMonth: 1_000_000 }

function errorFor(field: keyof typeof VALID, value: unknown): string | undefined {
  const result = simulatorFormSchema.safeParse({ ...VALID, [field]: value })
  return result.success ? undefined : result.error.issues[0]?.message
}

describe('simulatorFormSchema — espejo de validaciones.md', () => {
  it('acepta el caso dorado del contrato', () => {
    expect(simulatorFormSchema.safeParse(VALID).success).toBe(true)
  })

  // activeUsers: entero 1–100.000
  it.each([1, 100_000])('acepta activeUsers en el límite %i', (value) => {
    expect(errorFor('activeUsers', value)).toBeUndefined()
  })

  it.each([0, 100_001, 2.5])('rechaza activeUsers fuera de rango: %s', (value) => {
    expect(errorFor('activeUsers', value)).toBeDefined()
  })

  // storageGb: entero 0–1.000.000
  it.each([0, 1_000_000])('acepta storageGb en el límite %i', (value) => {
    expect(errorFor('storageGb', value)).toBeUndefined()
  })

  it.each([-1, 1_000_001, 1.5])('rechaza storageGb fuera de rango: %s', (value) => {
    expect(errorFor('storageGb', value)).toBeDefined()
  })

  // apiCallsMonth: entero 0–1.000.000.000
  it.each([0, 1_000_000_000])('acepta apiCallsMonth en el límite %i', (value) => {
    expect(errorFor('apiCallsMonth', value)).toBeUndefined()
  })

  it.each([-1, 1_000_000_001, 0.5])('rechaza apiCallsMonth fuera de rango: %s', (value) => {
    expect(errorFor('apiCallsMonth', value)).toBeDefined()
  })

  it('rechaza un campo vacío (NaN del input numérico)', () => {
    expect(errorFor('activeUsers', Number.NaN)).toBeDefined()
  })
})
