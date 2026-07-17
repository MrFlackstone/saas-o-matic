import { describe, expect, it } from 'vitest'
import { formatThousands, parseIntegerInput } from './number-format'

describe('formatThousands', () => {
  it('agrupa los miles con el separador español', () => {
    expect(formatThousands(1_000_000)).toBe('1.000.000')
    expect(formatThousands(500)).toBe('500')
    expect(formatThousands(0)).toBe('0')
  })
})

describe('parseIntegerInput', () => {
  it('acepta un entero escrito con separadores de miles', () => {
    expect(parseIntegerInput('1.000.000')).toBe(1_000_000)
    expect(parseIntegerInput(' 15 ')).toBe(15)
  })

  it('devuelve null cuando no hay un entero que leer', () => {
    expect(parseIntegerInput('')).toBeNull()
    expect(parseIntegerInput('abc')).toBeNull()
    expect(parseIntegerInput('1,5')).toBeNull()
    expect(parseIntegerInput('-')).toBeNull()
  })

  // Descartar la coma en vez de rechazarla convertiría 1,5 GB en 15 GB.
  it('rechaza los decimales y la basura en vez de compactarlos', () => {
    expect(parseIntegerInput('1a2')).toBeNull()
    expect(parseIntegerInput('2,5')).toBeNull()
  })
})
