import { apiGet, apiPost } from './client'
import type {
  CreateCustomerRequest,
  CustomerListResponse,
  CustomerResponse,
} from './types'

export interface CustomerSearchParams {
  search?: string
  page?: number
  limit?: number
}

export function searchCustomers(params: CustomerSearchParams = {}): Promise<CustomerListResponse> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return apiGet<CustomerListResponse>(`/customers${suffix}`)
}

export function getCustomer(id: string): Promise<CustomerResponse> {
  return apiGet<CustomerResponse>(`/customers/${id}`)
}

export function createCustomer(body: CreateCustomerRequest): Promise<CustomerResponse> {
  return apiPost<CustomerResponse>('/customers', body)
}
