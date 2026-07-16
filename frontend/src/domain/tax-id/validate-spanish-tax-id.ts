import { normalizeTaxId } from './normalize'
import {
  CIF_PATTERN,
  DNI_PATTERN,
  NIE_PATTERN,
  SPECIAL_NIF_PATTERN,
  isValidCif,
  isValidDni,
  isValidNie,
  isValidSpecialNif,
} from './spanish-tax-id'
import type { SpanishTaxIdKind, TaxIdValidationResult } from './types'

interface TaxIdRule {
  kind: SpanishTaxIdKind
  pattern: RegExp
  isValid: (candidate: string) => boolean
  invalidReason: string
}

const TAX_ID_RULES: TaxIdRule[] = [
  {
    kind: 'DNI',
    pattern: DNI_PATTERN,
    isValid: isValidDni,
    invalidReason: 'letra de control del DNI incorrecta',
  },
  {
    kind: 'NIE',
    pattern: NIE_PATTERN,
    isValid: isValidNie,
    invalidReason: 'letra de control del NIE incorrecta',
  },
  {
    kind: 'NIF_ESPECIAL',
    pattern: SPECIAL_NIF_PATTERN,
    isValid: isValidSpecialNif,
    invalidReason: 'letra de control del NIF especial incorrecta',
  },
  {
    kind: 'CIF',
    pattern: CIF_PATTERN,
    isValid: isValidCif,
    invalidReason: 'carácter de control del CIF incorrecto',
  },
]

export function validateSpanishTaxId(value: unknown): TaxIdValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, reason: 'identificador fiscal no es texto' }
  }
  const normalized = normalizeTaxId(value)
  if (normalized === '') {
    return { valid: false, reason: 'identificador fiscal vacío' }
  }
  for (const rule of TAX_ID_RULES) {
    if (rule.pattern.test(normalized)) {
      if (rule.isValid(normalized)) {
        return { valid: true, kind: rule.kind }
      }
      return { valid: false, kind: rule.kind, reason: rule.invalidReason }
    }
  }
  return {
    valid: false,
    reason: 'formato no reconocido como DNI, NIE, NIF especial o CIF',
  }
}
