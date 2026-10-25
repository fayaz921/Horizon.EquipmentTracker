// TypeScript interfaces mirroring backend DTOs exactly (field names match C# PascalCase serialized as camelCase via JsonStringEnumConverter)

// ─── Personnel ───────────────────────────────────────────────────────────────

export interface PersonnelDto {
  id: number
  name: string
  role: string
  phoneNumber: string
  isActive: boolean
}

// ─── Equipment ───────────────────────────────────────────────────────────────

/** Status values from EquipmentStatus enum (serialized as strings by API) */
export type EquipmentStatus =
  | 'Available'
  | 'Out'
  | 'PendingApproval'
  | 'NeedsInspection'
  | 'Lost'
  | 'Deactivated'

export interface SerializedEquipmentDto {
  id: number
  name: string
  serialNumber: string
  category: string
  status: EquipmentStatus
  requiresApproval: boolean
  isActive: boolean
}

export interface CountedInventoryDto {
  id: number
  name: string
  category: string
  totalQuantity: number
  quantityOut: number
  quantityInInspection: number
  availableQuantity: number
}

export interface EquipmentAvailabilityDto {
  serialized: SerializedEquipmentDto[]
  counted: CountedInventoryDto[]
}

// ─── Survey Kits ─────────────────────────────────────────────────────────────

export interface KitItemDto {
  category: string
  type: 'serialized' | 'counted'
  quantity: number
}

export interface SurveyKitDto {
  id: number
  name: string
  description: string
  items: KitItemDto[]
}

// ─── Checkout REQUEST ─────────────────────────────────────────────────────────

export interface CheckoutLineRequestDto {
  serializedEquipmentId?: number | null
  countedInventoryId?: number | null
  quantity: number
  recipientId: number
  expectedReturnDate: string  // yyyy-MM-dd
}

export interface CreateCheckoutRequestDto {
  loggedById: number
  lines: CheckoutLineRequestDto[]
}

// ─── Checkout RESPONSE ────────────────────────────────────────────────────────

export interface CheckoutLineResponseDto {
  lineId: number
  serializedEquipmentId: number | null
  serializedEquipmentName: string | null
  countedInventoryId: number | null
  countedInventoryName: string | null
  quantity: number
  recipientId: number
  recipientName: string
  expectedReturnDate: string
  isClosed: boolean
  status: string
}

export interface CheckoutResponseDto {
  checkoutEventId: number
  loggedById: number
  loggedByName: string
  checkoutTimestamp: string
  lines: CheckoutLineResponseDto[]
}

// ─── Active Custody ───────────────────────────────────────────────────────────

export interface ActiveCustodyLineDto {
  lineId: number
  checkoutEventId: number
  recipientId: number
  recipientName: string
  recipientPhone: string
  formattedRecipientPhone: string
  serializedEquipmentId: number | null
  serializedEquipmentName: string | null
  serialNumber: string | null
  countedInventoryId: number | null
  countedInventoryName: string | null
  quantity: number
  expectedReturnDate: string
  isOverdue: boolean
  isDueToday: boolean
  statusBadge: string
  daysDelinquent: number
  extensionCount: number
  whatsAppReminderUrl: string | null
  checkoutTimestamp: string
}

// ─── Return REQUEST / RESPONSE ───────────────────────────────────────────────

export type ReturnCondition = 'Good' | 'Damaged'

export interface ReturnRequestDto {
  condition: ReturnCondition
  conditionNotes?: string | null
  quantity: number
}

export interface ReturnResponseDto {
  lineId: number
  isClosed: boolean
  actualReturnTimestamp: string
  condition: string
  conditionNotes: string | null
  quantityReturned: number
  quantityStillOut: number
  newEquipmentStatus: string | null
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export interface PendingApprovalDto {
  lineId: number
  checkoutEventId: number
  serializedEquipmentId: number
  equipmentName: string
  serialNumber: string
  category: string
  recipientId: number
  recipientName: string
  loggedById: number
  loggedByName: string
  approverId: number | null
  approverName: string
  expectedReturnDate: string
  checkoutTimestamp: string
  status: string
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ProblemDetails {
  title: string
  status: number
  detail?: string
  errors?: Record<string, string[]>
}
