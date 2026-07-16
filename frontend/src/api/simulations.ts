import { apiGet, apiPost } from './client'
import type {
  CreateSimulationRequest,
  SimulationListResponse,
  SimulationResponse,
} from './types'

export function createSimulation(body: CreateSimulationRequest): Promise<SimulationResponse> {
  return apiPost<SimulationResponse>('/simulations', body)
}

export function getCustomerSimulations(customerId: string): Promise<SimulationListResponse> {
  return apiGet<SimulationListResponse>(`/customers/${customerId}/simulations`)
}
