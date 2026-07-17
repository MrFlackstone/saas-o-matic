import { ApiError } from '@/api/client'

// Un 400 conserva todos los `details` del contrato; un 404 (cliente inexistente)
// llega sin ellos y solo trae `message`.
export function toErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'No se pudo guardar la simulación. Inténtalo de nuevo.'
  }
  const details = error.details.map((detail) => detail.message)
  return details.length > 0 ? details.join(' · ') : error.message
}
