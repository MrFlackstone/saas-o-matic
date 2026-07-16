import { describe, expect, it } from 'vitest'
import { customerFormSchema, type CustomerFormValues } from './customer-form-schema'

const VALID: CustomerFormValues = {
  companyName: 'Acme Iberia SL',
  email: 'facturacion@acme.es',
  countryCode: 'ES',
  planCode: 'PRO',
  taxId: 'B58818501',
}

function issuesFor(values: Partial<CustomerFormValues>): string[] {
  const result = customerFormSchema.safeParse({ ...VALID, ...values })
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('customerFormSchema — caso válido', () => {
  it('acepta el cliente de referencia del seed', () => {
    expect(customerFormSchema.safeParse(VALID).success).toBe(true)
  })
})

describe('customerFormSchema — companyName', () => {
  it.each([
    ['', false],
    ['A', false],
    ['AB', true],
    ['A'.repeat(120), true],
    ['A'.repeat(121), false],
  ])('«%s» (len) → válido=%s', (companyName, valid) => {
    expect(issuesFor({ companyName }).includes('companyName')).toBe(!valid)
  })

  it('recorta espacios antes de medir la longitud', () => {
    expect(issuesFor({ companyName: '  A  ' })).toContain('companyName')
    expect(issuesFor({ companyName: '  AB  ' })).not.toContain('companyName')
  })
})

describe('customerFormSchema — email', () => {
  it.each([
    ['facturacion@acme.es', true],
    ['sin-arroba', false],
    ['', false],
    [`${'a'.repeat(246)}@acme.es`, true],
    [`${'a'.repeat(247)}@acme.es`, false],
  ])('«%s» → válido=%s', (email, valid) => {
    expect(issuesFor({ email }).includes('email')).toBe(!valid)
  })
})

describe('customerFormSchema — countryCode y planCode', () => {
  it.each(['ES', 'US', 'GB'])('acepta el país sembrado %s', (countryCode) => {
    // taxId extranjero para no cruzarse con la rama fiscal española.
    const taxId = countryCode === 'ES' ? VALID.taxId : '981234567'
    expect(issuesFor({ countryCode, taxId })).not.toContain('countryCode')
  })

  it.each(['', 'XX', 'es'])('rechaza el país «%s» fuera de la lista RN-02', (countryCode) => {
    expect(issuesFor({ countryCode })).toContain('countryCode')
  })

  it.each(['STARTER', 'PRO', 'ENTERPRISE'])('acepta el plan %s', (planCode) => {
    expect(issuesFor({ planCode })).not.toContain('planCode')
  })

  it.each(['', 'GRATIS', 'pro'])('rechaza el plan «%s»', (planCode) => {
    expect(issuesFor({ planCode })).toContain('planCode')
  })
})

describe('customerFormSchema — taxId, rama ES', () => {
  it.each([
    ['B58818501', 'CIF válido'],
    ['12345678Z', 'DNI válido'],
    ['X1234567L', 'NIE válido'],
  ])('acepta %s (%s)', (taxId) => {
    expect(issuesFor({ taxId })).not.toContain('taxId')
  })

  it.each([
    ['b-5881850-1', 'minúsculas y guiones'],
    ['  B58818501 ', 'espacios alrededor'],
    ['12.345.678-z', 'puntos y guion'],
  ])('normaliza antes de validar: %s (%s)', (taxId) => {
    expect(issuesFor({ taxId })).not.toContain('taxId')
  })

  it.each([
    ['B58818500', 'dígito de control del CIF incorrecto'],
    ['12345678A', 'letra del DNI incorrecta'],
    ['', 'vacío'],
    ['981234567', 'identificador extranjero en país ES'],
  ])('rechaza %s (%s)', (taxId) => {
    expect(issuesFor({ taxId })).toContain('taxId')
  })

  it('explica el motivo del rechazo en el mensaje', () => {
    const result = customerFormSchema.safeParse({ ...VALID, taxId: 'B58818500' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/^Identificador fiscal no válido: .+/)
    }
  })
})

describe('customerFormSchema — taxId, rama extranjera', () => {
  it.each([
    ['981234567', 'US'],
    ['PT509442013', 'PT'],
    ['ABCD', 'FR'],
    ['A'.repeat(20), 'DE'],
  ])('acepta «%s» para %s', (taxId, countryCode) => {
    expect(issuesFor({ countryCode, taxId })).not.toContain('taxId')
  })

  it.each([
    ['pt509442013', 'PT'],
    ['  981234567 ', 'US'],
    ['PT-5094-42013', 'PT'],
  ])('normaliza antes de validar: «%s» para %s', (taxId, countryCode) => {
    expect(issuesFor({ countryCode, taxId })).not.toContain('taxId')
  })

  it.each([
    ['ABC', 'US', 'menos de 4 caracteres'],
    ['A'.repeat(21), 'US', 'más de 20 caracteres'],
    ['', 'PT', 'vacío'],
    ['ABC_123', 'FR', 'carácter no alfanumérico que la normalización no elimina'],
  ])('rechaza «%s» para %s (%s)', (taxId, countryCode) => {
    expect(issuesFor({ countryCode, taxId })).toContain('taxId')
  })

  it('no aplica el algoritmo fiscal español fuera de ES', () => {
    // B58818500 tiene el control incorrecto, pero para PT solo aplica el patrón genérico.
    expect(issuesFor({ countryCode: 'PT', taxId: 'B58818500' })).not.toContain('taxId')
  })
})
