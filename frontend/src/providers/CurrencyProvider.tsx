import { useState, type ReactNode } from 'react'
import { CURATED_CURRENCIES, isCurrencyCode, type CurrencyCode } from '@/api/exchange'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { CurrencyContext } from './currency-context'

const STORAGE_KEY = 'saas-o-matic:currency'

function readStoredCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw !== null && isCurrencyCode(raw) ? raw : 'EUR'
  } catch {
    return 'EUR'
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const exchange = useExchangeRates()
  const [selected, setSelected] = useState<CurrencyCode>(readStoredCurrency)

  const setCurrency = (code: CurrencyCode): void => {
    setSelected(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Sin persistencia: la selección sigue viva en memoria.
    }
  }

  // Degradación (spec-frontend): sin tasa utilizable para la divisa elegida,
  // todo importe se muestra en EUR.
  const selectedRate = selected === 'EUR' ? 1 : exchange.rates?.[selected]
  const currency: CurrencyCode = selectedRate === undefined ? 'EUR' : selected
  const rate = selectedRate ?? 1

  const currencies: readonly CurrencyCode[] = exchange.rates
    ? CURATED_CURRENCIES.filter(
        (code) => code === 'EUR' || exchange.rates?.[code] !== undefined,
      )
    : ['EUR']

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, currencies, exchange }}>
      {children}
    </CurrencyContext.Provider>
  )
}
