import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CurrencyCode } from '@/api/exchange'
import { CurrencyContext } from '@/providers/currency-context'
import { ProjectionPanel } from './ProjectionPanel'

const VAT_ES_BPS = 2100

function withCurrency(ui: ReactNode, currency: CurrencyCode = 'EUR', rate = 1) {
  return render(
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: () => undefined,
        rate,
        currencies: ['EUR', 'USD'],
        exchange: { status: 'live', rates: { EUR: 1, USD: 2 }, updatedAt: null, retry: () => undefined },
      }}
    >
      {ui}
    </CurrencyContext.Provider>,
  )
}

// `Intl` usa NBSP ( ) antes del símbolo; normalizarlo mantiene legible el aserto.
function cellText(label: string): string {
  const row = screen.getByRole('row', { name: new RegExp(label) })
  const cells = row.querySelectorAll('td')
  return (cells[cells.length - 1]?.textContent ?? '').replace(/ /g, ' ')
}

describe('ProjectionPanel — caso dorado RN-01/RN-02', () => {
  it('proyecta 15 usuarios ES en EUR: 140,00 € base y 169,40 € total', () => {
    withCurrency(<ProjectionPanel activeUsers={15} vatRateBps={VAT_ES_BPS} />)

    expect(cellText('^Base')).toBe('140,00 €')
    expect(cellText('^IVA')).toBe('29,40 €')
    expect(cellText('^Total')).toBe('169,40 €')
  })

  it('desglosa los dos tramos de 15 usuarios', () => {
    withCurrency(<ProjectionPanel activeUsers={15} vatRateBps={VAT_ES_BPS} />)

    expect(cellText('Tramo 1')).toBe('100,00 €')
    expect(cellText('Tramo 2')).toBe('40,00 €')
  })

  it('convierte la proyección a la divisa activa', () => {
    withCurrency(<ProjectionPanel activeUsers={15} vatRateBps={VAT_ES_BPS} />, 'USD', 2)

    // `es-ES` desambigua el dólar como «US$»; es el formato de `formatMoney`.
    expect(cellText('^Total')).toBe('338,80 US$')
  })

  it('anuncia los cambios por aria-live y avisa de que el servidor es la autoridad', () => {
    withCurrency(<ProjectionPanel activeUsers={15} vatRateBps={VAT_ES_BPS} />)

    expect(screen.getByRole('status')).toHaveProperty('ariaLive', 'polite')
    expect(screen.getByText(/Proyección orientativa/)).toBeDefined()
  })

  it('no proyecta nada si el formulario aún no tiene usuarios válidos', () => {
    withCurrency(<ProjectionPanel activeUsers={null} vatRateBps={VAT_ES_BPS} />)

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText(/Introduce/)).toBeDefined()
  })
})
