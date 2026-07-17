import { validateSpanishTaxId } from '../src/domain/tax-id/validate-spanish-tax-id'

const CONTROL_CHARS = '0123456789JABCDEFGHI'

/**
 * Deriva un CIF válido y distinto en cada ejecución (el alta rechaza duplicados
 * con 409). El carácter de control se busca contra el validador de dominio, que
 * es la fuente de verdad: el algoritmo no se replica aquí.
 */
export function makeUniqueCif(): string {
  const body = String(Date.now()).slice(-7)
  for (const control of CONTROL_CHARS) {
    const candidate = `B${body}${control}`
    if (validateSpanishTaxId(candidate).valid) {
      return candidate
    }
  }
  throw new Error(`Sin carácter de control válido para el CIF B${body}`)
}
