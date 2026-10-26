import type {
  PersonnelDto,
  EquipmentAvailabilityDto,
  SurveyKitDto,
  ActiveCustodyLineDto,
  CreateCheckoutRequestDto,
  CheckoutResponseDto,
  ReturnRequestDto,
  ReturnResponseDto,
  ApproveRequestDto,
  PendingApprovalDto,
  ApprovalResponseDto,
  CancelApprovalResponseDto,
  ExtendDueDateRequestDto,
  DueDateExtensionResponseDto,
  HistoryLineResponseDto,
  ClearInspectionRequestDto,
  ClearInspectionResponseDto,
  MarkLostRequestDto,
  MarkLostResponseDto,
  CreatePersonnelRequestDto,
  UpdatePersonnelRequestDto,
  CreateEquipmentRequestDto,
  UpdateEquipmentRequestDto,
  EquipmentAdminResponseDto,
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

// ─── Due Date Extension (Story 6.5) ──────────────────────────────────────────

export const extendCheckoutLine = (
  lineId: number,
  body: ExtendDueDateRequestDto,
  adminPin?: string,
): Promise<DueDateExtensionResponseDto> => {
  const headers: Record<string, string> = {}
  if (adminPin) {
    headers['X-Admin-PIN'] = adminPin
  }
  return request<DueDateExtensionResponseDto>(`/api/checkouts/${lineId}/extend`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

// ─── Returns ─────────────────────────────────────────────────────────────────

export const returnLine = (lineId: number, body: ReturnRequestDto): Promise<ReturnResponseDto> =>
  request<ReturnResponseDto>(`/api/returns/${lineId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

// ─── Approvals (Story 6.6) ────────────────────────────────────────────────────

export const fetchPendingApprovals = (): Promise<PendingApprovalDto[]> =>
  request<PendingApprovalDto[]>('/api/approvals/pending')

export const approvePendingRequest = (
  lineId: number,
  body: ApproveRequestDto,
): Promise<ApprovalResponseDto> =>
  request<ApprovalResponseDto>(`/api/approvals/${lineId}/approve`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const cancelPendingRequest = (
  lineId: number,
): Promise<CancelApprovalResponseDto> =>
  request<CancelApprovalResponseDto>(`/api/approvals/${lineId}/cancel`, {
    method: 'POST',
  })

// ─── History (Story 6.7) ──────────────────────────────────────────────────────

export const fetchHistory = (params?: {
  preset?: string
  from?: string
  to?: string
  personId?: number
  equipmentId?: number
}): Promise<HistoryLineResponseDto[]> => {
  const query = new URLSearchParams()
  if (params?.preset) query.set('preset', params.preset)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  if (params?.personId) query.set('personId', params.personId.toString())
  if (params?.equipmentId) query.set('equipmentId', params.equipmentId.toString())

  const queryString = query.toString()
  const url = queryString ? `/api/history?${queryString}` : '/api/history'
  return request<HistoryLineResponseDto[]>(url)
}

// ─── Admin Management (Story 6.8) ─────────────────────────────────────────────

export const clearInspection = (
  equipmentId: number,
  body: ClearInspectionRequestDto,
  adminPin: string,
): Promise<ClearInspectionResponseDto> =>
  request<ClearInspectionResponseDto>(`/api/admin/equipment/${equipmentId}/clear-inspection`, {
    method: 'POST',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const markAssetLost = (
  equipmentId: number,
  body: MarkLostRequestDto,
  adminPin: string,
): Promise<MarkLostResponseDto> =>
  request<MarkLostResponseDto>(`/api/admin/equipment/${equipmentId}/mark-lost`, {
    method: 'POST',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const adminCreatePersonnel = (
  body: CreatePersonnelRequestDto,
  adminPin: string,
): Promise<PersonnelDto> =>
  request<PersonnelDto>('/api/admin/personnel', {
    method: 'POST',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const adminUpdatePersonnel = (
  id: number,
  body: UpdatePersonnelRequestDto,
  adminPin: string,
): Promise<PersonnelDto> =>
  request<PersonnelDto>(`/api/admin/personnel/${id}`, {
    method: 'PUT',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const adminDeactivatePersonnel = (
  id: number,
  adminPin: string,
): Promise<PersonnelDto> =>
  request<PersonnelDto>(`/api/admin/personnel/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-PIN': adminPin },
  })

export const adminCreateEquipment = (
  body: CreateEquipmentRequestDto,
  adminPin: string,
): Promise<EquipmentAdminResponseDto> =>
  request<EquipmentAdminResponseDto>('/api/admin/equipment', {
    method: 'POST',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const adminUpdateEquipment = (
  id: number,
  body: UpdateEquipmentRequestDto,
  adminPin: string,
): Promise<EquipmentAdminResponseDto> =>
  request<EquipmentAdminResponseDto>(`/api/admin/equipment/${id}`, {
    method: 'PUT',
    headers: { 'X-Admin-PIN': adminPin },
    body: JSON.stringify(body),
  })

export const adminDeactivateEquipment = (
  id: number,
  adminPin: string,
): Promise<EquipmentAdminResponseDto> =>
  request<EquipmentAdminResponseDto>(`/api/admin/equipment/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-PIN': adminPin },
  })

