import { config } from '@/lib/config'
import type { ApiErrorBody, ApiErrorDetail } from './types'

export class ApiError extends Error {
  readonly statusCode: number
  readonly details: ApiErrorDetail[]

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.statusCode = body.statusCode
    this.details = body.details ?? []
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    return new ApiError((await response.json()) as ApiErrorBody)
  } catch {
    // Respuesta sin cuerpo JSON (proxy caído, HTML de error…): error genérico.
    return new ApiError({
      statusCode: response.status,
      error: response.statusText,
      message: `Error ${response.status} del servidor`,
      timestamp: new Date().toISOString(),
      path: response.url,
    })
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, init)
  if (!response.ok) {
    throw await toApiError(response)
  }
  return (await response.json()) as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
