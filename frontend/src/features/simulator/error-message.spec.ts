import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import type { ApiErrorDetail } from '@/api/types'
import { toErrorMessage } from './error-message'

function apiError(message: string, details: ApiErrorDetail[]): ApiError {
  return new ApiError({
    statusCode: 400,
    error: 'Bad Request',
    message,
    details,
    timestamp: '2026-07-16T10:00:00.000Z',
    path: '/simulations',
  })
}

describe('toErrorMessage', () => {
  // Hallazgo de la auditoría de fase 8: details[0] descartaba el resto de errores.
  it('conserva todos los detalles del contrato, no solo el primero', () => {
    const error = apiError('Validación fallida', [
      { field: 'activeUsers', code: 'ACTIVE_USERS_RANGE', message: 'Usuarios fuera de rango' },
      { field: 'storageGb', code: 'STORAGE_RANGE', message: 'Almacenamiento fuera de rango' },
    ])

    expect(toErrorMessage(error)).toBe('Usuarios fuera de rango · Almacenamiento fuera de rango')
  })

  it('usa el mensaje del contrato cuando el error no trae detalles (404)', () => {
    expect(toErrorMessage(apiError('Cliente no encontrado', []))).toBe('Cliente no encontrado')
  })

  it('degrada a un mensaje genérico si el fallo no es del contrato', () => {
    expect(toErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'No se pudo guardar la simulación. Inténtalo de nuevo.',
    )
  })
})
