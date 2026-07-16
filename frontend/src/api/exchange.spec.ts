import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readCachedRates } from './exchange'

const STORAGE_KEY = 'saas-o-matic:exchange-rates'
const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readCachedRates', () => {
  it('devuelve null sin caché previa', () => {
    expect(readCachedRates()).toBeNull()
  })

  it('devuelve el snapshot cacheado si es válido', () => {
    const snapshot = { rates: { USD: 1.08 }, updatedAt: '2026-07-15T10:00:00.000Z' }
    store.set(STORAGE_KEY, JSON.stringify(snapshot))
    expect(readCachedRates()).toEqual(snapshot)
  })

  it('devuelve null si la caché no es JSON', () => {
    store.set(STORAGE_KEY, 'no-es-json')
    expect(readCachedRates()).toBeNull()
  })

  it('devuelve null si el shape no es un snapshot', () => {
    store.set(STORAGE_KEY, JSON.stringify({ rates: 'corrupto' }))
    expect(readCachedRates()).toBeNull()
  })

  it('devuelve null si alguna tasa no es numérica', () => {
    store.set(
      STORAGE_KEY,
      JSON.stringify({ rates: { USD: 'x' }, updatedAt: '2026-07-15T10:00:00.000Z' }),
    )
    expect(readCachedRates()).toBeNull()
  })

  it('devuelve null si updatedAt no es una fecha parseable', () => {
    store.set(STORAGE_KEY, JSON.stringify({ rates: { USD: 1.08 }, updatedAt: 'ayer' }))
    expect(readCachedRates()).toBeNull()
  })
})
