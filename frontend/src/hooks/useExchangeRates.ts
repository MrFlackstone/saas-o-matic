import { useQuery } from '@tanstack/react-query'
import { fetchExchangeRates, readCachedRates } from '@/api/exchange'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export type ExchangeRatesStatus = 'loading' | 'live' | 'stale' | 'unavailable'

export interface ExchangeRatesState {
  status: ExchangeRatesStatus
  rates: Record<string, number> | null
  updatedAt: string | null
  retry: () => void
}

export function useExchangeRates(): ExchangeRatesState {
  const query = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchExchangeRates,
    staleTime: TWELVE_HOURS_MS,
    gcTime: TWENTY_FOUR_HOURS_MS,
    retry: 2,
  })
  const retry = (): void => {
    void query.refetch()
  }
  if (query.data) {
    return { status: 'live', rates: query.data.rates, updatedAt: query.data.updatedAt, retry }
  }
  if (query.isError) {
    const cached = readCachedRates()
    if (cached) {
      return { status: 'stale', rates: cached.rates, updatedAt: cached.updatedAt, retry }
    }
    return { status: 'unavailable', rates: null, updatedAt: null, retry }
  }
  return { status: 'loading', rates: null, updatedAt: null, retry }
}
