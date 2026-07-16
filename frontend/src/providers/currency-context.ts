import { createContext, useContext } from 'react'
import type { CurrencyCode } from '@/api/exchange'
import type { ExchangeRatesState } from '@/hooks/useExchangeRates'

export interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  rate: number
  currencies: readonly CurrencyCode[]
  exchange: ExchangeRatesState
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext)
  if (context === null) {
    throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>')
  }
  return context
}
