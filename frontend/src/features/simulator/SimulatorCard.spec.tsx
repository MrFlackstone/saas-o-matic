import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SimulationResponse } from '@/api/types'
import { CurrencyContext } from '@/providers/currency-context'
import { SimulatorCard } from './SimulatorCard'

const createSimulation = vi.hoisted(() => vi.fn())
vi.mock('@/api/simulations', () => ({ createSimulation }))

const SERVER_SIMULATION: SimulationResponse = {
  id: 'sim-1',
  activeUsers: 15,
  storageGb: 0,
  apiCallsMonth: 0,
  baseCents: 14_000,
  vatRateBps: 2100,
  taxCents: 2_940,
  totalCents: 16_940,
  breakdown: [],
  createdAt: '2026-07-16T10:00:00.000Z',
}

function renderCard(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <CurrencyContext.Provider
        value={{
          currency: 'EUR',
          setCurrency: () => undefined,
          rate: 1,
          currencies: ['EUR'],
          exchange: { status: 'live', rates: { EUR: 1 }, updatedAt: null, retry: () => undefined },
        }}
      >
        {children}
      </CurrencyContext.Provider>
    </QueryClientProvider>
  )
  render(wrapper(<SimulatorCard customerId="cus-1" vatRateBps={2100} />))
}

const usersInput = () => screen.getByRole('textbox', { name: 'Usuarios activos' })
const saveButton = () => screen.getByRole('button', { name: /Guardar simulación/ })

beforeEach(() => {
  createSimulation.mockReset()
})

describe('SimulatorCard', () => {
  it('sincroniza el slider hacia el input y es operable por teclado', () => {
    renderCard()
    const slider = screen.getByRole('slider')
    slider.focus()

    fireEvent.keyDown(slider, { key: 'ArrowRight' })

    expect(usersInput()).toHaveProperty('value', '16')
  })

  it('fija el slider en su tope visual cuando el input supera 500', () => {
    renderCard()

    fireEvent.change(usersInput(), { target: { value: '100000' } })

    expect(usersInput()).toHaveProperty('value', '100.000')
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('500')
  })

  it('retira la proyección cuando los usuarios salen del rango del contrato', async () => {
    renderCard()

    fireEvent.change(usersInput(), { target: { value: '100001' } })

    await waitFor(() => {
      expect(screen.queryByRole('table')).toBeNull()
    })
    expect(await screen.findByText(/entre 1 y 100.000/)).toBeDefined()
  })

  // El doble click no debe crear dos simulaciones (criterio de aceptación).
  it('solo envía una simulación aunque se pulse guardar dos veces', async () => {
    createSimulation.mockReturnValue(new Promise(() => undefined))
    renderCard()

    fireEvent.click(saveButton())
    await waitFor(() => {
      expect(saveButton()).toHaveProperty('disabled', true)
    })
    fireEvent.click(saveButton())

    expect(createSimulation).toHaveBeenCalledTimes(1)
    // TanStack Query añade su contexto como segundo argumento: solo interesa el body.
    expect(createSimulation.mock.calls[0]?.[0]).toEqual({
      customerId: 'cus-1',
      activeUsers: 15,
      storageGb: 0,
      apiCallsMonth: 0,
    })
  })

  it('no envía nada si el formulario es inválido', async () => {
    renderCard()

    fireEvent.change(usersInput(), { target: { value: '' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined()
    })
    expect(createSimulation).not.toHaveBeenCalled()
  })

  it('devuelve el formulario a sus valores por defecto tras guardar', async () => {
    createSimulation.mockResolvedValue(SERVER_SIMULATION)
    renderCard()

    fireEvent.change(usersInput(), { target: { value: '42' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(usersInput()).toHaveProperty('value', '15')
    })
  })
})
