import type {
  PersonnelDto,
  EquipmentAvailabilityDto,
  SurveyKitDto,
  ActiveCustodyLineDto,
  CreateCheckoutRequestDto,
  CheckoutResponseDto,
  ReturnRequestDto,
  ReturnResponseDto,
  PendingApprovalDto,
  ProblemDetails,
} from '../types'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? problem.title)
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  if (res.status === 204) return undefined as unknown as T
  const body = await res.json() as unknown

  if (!res.ok) {
    throw new ApiError(res.status, body as ProblemDetails)
  }
  return body as T
}

// ─── Personnel ───────────────────────────────────────────────────────────────

export const fetchPersonnel = (): Promise<PersonnelDto[]> =>
  request<PersonnelDto[]>('/api/personnel')

// ─── Equipment ───────────────────────────────────────────────────────────────

export const fetchEquipment = (): Promise<EquipmentAvailabilityDto> =>
  request<EquipmentAvailabilityDto>('/api/equipment')

// ─── Survey Kits ─────────────────────────────────────────────────────────────

export const fetchKits = (): Promise<SurveyKitDto[]> =>
  request<SurveyKitDto[]>('/api/kits')

// ─── Active Custody ───────────────────────────────────────────────────────────

export const fetchActiveCustody = (): Promise<ActiveCustodyLineDto[]> =>
  request<ActiveCustodyLineDto[]>('/api/checkouts/active')

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const createCheckout = (body: CreateCheckoutRequestDto): Promise<CheckoutResponseDto> =>
  request<CheckoutResponseDto>('/api/checkouts', {
    method: 'POST',
    body: JSON.stringify(body),
  })

// ─── Returns ─────────────────────────────────────────────────────────────────

export const returnLine = (lineId: number, body: ReturnRequestDto): Promise<ReturnResponseDto> =>
  request<ReturnResponseDto>(`/api/returns/${lineId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

// ─── Approvals ────────────────────────────────────────────────────────────────

export const fetchPendingApprovals = (): Promise<PendingApprovalDto[]> =>
  request<PendingApprovalDto[]>('/api/approvals')
