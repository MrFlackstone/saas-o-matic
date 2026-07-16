// API externa de tipos de cambio (contratos-api.md): la conversión es
// presentación pura (RN-03); el backend no interviene.

export const CURATED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'MXN'] as const
export type CurrencyCode = (typeof CURATED_CURRENCIES)[number]

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURATED_CURRENCIES as readonly string[]).includes(value)
}

export interface ExchangeRatesSnapshot {
  rates: Record<string, number>
  updatedAt: string
}

interface ErApiResponse {
  result: string
  base_code: string
  rates: Record<string, number>
}

const RATES_URL = 'https://open.er-api.com/v6/latest/EUR'
const STORAGE_KEY = 'saas-o-matic:exchange-rates'

export async function fetchExchangeRates(): Promise<ExchangeRatesSnapshot> {
  const response = await fetch(RATES_URL)
  if (!response.ok) {
    throw new Error(`El proveedor de tasas respondió ${response.status}`)
  }
  const body = (await response.json()) as ErApiResponse
  if (body.result !== 'success') {
    throw new Error('El proveedor de tasas devolvió un error')
  }
  const snapshot: ExchangeRatesSnapshot = {
    rates: body.rates,
    updatedAt: new Date().toISOString(),
  }
  saveCachedRates(snapshot)
  return snapshot
}

function isSnapshot(value: unknown): value is ExchangeRatesSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { rates, updatedAt } = value as Record<string, unknown>
  if (typeof updatedAt !== 'string' || Number.isNaN(Date.parse(updatedAt))) {
    return false
  }
  if (typeof rates !== 'object' || rates === null) {
    return false
  }
  return Object.values(rates as Record<string, unknown>).every(
    (rate) => typeof rate === 'number' && Number.isFinite(rate),
  )
}

// Caché escrita por esta app pero fuera de su control (editable a mano):
// un shape inválido degrada a "sin caché" en vez de romper la UI.
export function readCachedRates(): ExchangeRatesSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return isSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveCachedRates(snapshot: ExchangeRatesSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Almacenamiento bloqueado o lleno: la caché es una mejora, no un requisito.
  }
}
