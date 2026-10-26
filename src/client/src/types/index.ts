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

export interface ApproveRequestDto {
  approverPin: string
}

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

export interface ApprovalResponseDto {
  lineId: number
  serializedEquipmentId: number
  equipmentName: string
  recipientId: number
  recipientName: string
  status: string
  approvedTimestamp: string
  message: string
}

export interface CancelApprovalResponseDto {
  lineId: number
  serializedEquipmentId: number
  equipmentName: string
  status: string
  isClosed: boolean
  cancelledTimestamp: string
  message: string
}

// ─── Due Date Extension ───────────────────────────────────────────────────────

export interface ExtendDueDateRequestDto {
  newExpectedReturnDate: string // yyyy-MM-dd
  extendedById: number
}

export interface DueDateExtensionResponseDto {
  extensionLogId: number
  checkoutLineId: number
  previousDate: string
  newDate: string
  extendedById: number
  extendedByName: string
  timestamp: string
  extensionCount: number
  message: string
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryLineResponseDto {
  lineId: number
  checkoutEventId: number
  checkoutTimestamp: string
  actualReturnTimestamp: string | null
  expectedReturnDate: string
  isClosed: boolean
  returnCondition: string | null
  conditionNotes: string | null
  recipientId: number
  recipientName: string
  loggedById: number
  loggedByName: string
  serializedEquipmentId: number | null
  serializedEquipmentName: string | null
  serialNumber: string | null
  countedInventoryId: number | null
  countedInventoryName: string | null
  quantity: number
  extensionCount: number
}

// ─── Admin DTOs ───────────────────────────────────────────────────────────────

export interface ClearInspectionRequestDto {
  quantity?: number
  resolutionNotes?: string | null
  itemType?: string | null
}

export interface ClearInspectionResponseDto {
  equipmentId: number
  itemType: string
  name: string
  quantityCleared: number
  remainingInInspection: number
  status: string
  resolutionNotes: string | null
  clearedTimestamp: string
  message: string
}

export interface MarkLostRequestDto {
  notes?: string | null
  itemType?: string | null
}

export interface MarkLostResponseDto {
  equipmentId: number
  itemType: string
  name: string
  serialNumber: string | null
  previousStatus: string
  newStatus: string
  closedOpenCheckout: boolean
  closedLineId: number | null
  timestamp: string
  message: string
}

export interface CreatePersonnelRequestDto {
  name: string
  role: string
  phoneNumber: string
}

export interface UpdatePersonnelRequestDto {
  name: string
  role: string
  phoneNumber: string
  isActive?: boolean | null
}

export interface CreateEquipmentRequestDto {
  itemType?: string // 'serialized' | 'counted'
  name: string
  category: string
  serialNumber?: string | null
  requiresApproval?: boolean
  approverId?: number | null
  totalQuantity?: number
}

export interface UpdateEquipmentRequestDto {
  itemType?: string | null
  name?: string | null
  category?: string | null
  serialNumber?: string | null
  requiresApproval?: boolean | null
  approverId?: number | null
  totalQuantity?: number | null
  isActive?: boolean | null
}

export interface EquipmentAdminResponseDto {
  id: number
  itemType: string
  name: string
  category: string
  serialNumber: string | null
  status: string
  requiresApproval: boolean
  approverId: number | null
  approverName: string | null
  totalQuantity: number | null
  availableQuantity: number | null
  isActive: boolean
  message: string
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ProblemDetails {
  title: string
  status: number
  detail?: string
  errors?: Record<string, string[]>
}

