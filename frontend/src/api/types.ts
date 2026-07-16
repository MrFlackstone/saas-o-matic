// Shapes transcritos de ai-workspace/01-specs/contratos-api.md.
// Importes en céntimos de EUR (`Cents`); IVA en puntos básicos (`Bps`).

export interface CountrySummary {
  code: string
  name: string
  vatRateBps: number
}

export interface PlanSummary {
  code: string
  name: string
}

export interface CustomerResponse {
  id: string
  companyName: string
  taxId: string
  email: string
  country: CountrySummary
  plan: PlanSummary
  createdAt: string
}

export interface CustomerListResponse {
  items: CustomerResponse[]
  total: number
  page: number
  limit: number
}

export interface CreateCustomerRequest {
  companyName: string
  taxId: string
  email: string
  countryCode: string
  planCode: string
}

export interface SimulationTierLine {
  tier: number
  fromUser: number
  toUser: number
  users: number
  unitCents: number
  amountCents: number
}

export interface SimulationResponse {
  id: string
  activeUsers: number
  storageGb: number
  apiCallsMonth: number
  baseCents: number
  vatRateBps: number
  taxCents: number
  totalCents: number
  breakdown: SimulationTierLine[]
  createdAt: string
}

export interface SimulationListResponse {
  items: SimulationResponse[]
}

export interface CreateSimulationRequest {
  customerId: string
  activeUsers: number
  storageGb: number
  apiCallsMonth: number
}

export interface ApiErrorDetail {
  field: string
  code: string
  message: string
}

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string
  details?: ApiErrorDetail[]
  timestamp: string
  path: string
}
