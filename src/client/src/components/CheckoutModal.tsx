import { useState, useEffect, useCallback } from 'react'
import type {
  SerializedEquipmentDto,
  CountedInventoryDto,
  CheckoutLineRequestDto,
} from '../types'
import { usePersonnel, useEquipmentAndKits } from '../hooks/useData'
import { createCheckout, ApiError } from '../api/apiClient'
import { getTodayPkt, getTomorrowPkt } from '../utils/dateUtils'

interface CheckoutLine {
  id: number
  serializedEquipmentId: number | null
  countedInventoryId: number | null
  quantity: number
  recipientId: number
}

interface CheckoutModalProps {
  onClose: () => void
  onSuccess: () => void
}

let _lineIdSeq = 0
function nextLineId() { return ++_lineIdSeq }

export default function CheckoutModal({ onClose, onSuccess }: CheckoutModalProps) {
  const { personnel, loading: personnelLoading } = usePersonnel()
  const { equipment, kits, loading: equipLoading } = useEquipmentAndKits()

  const [loggedById, setLoggedById] = useState<number>(0)
  const [returnDateMode, setReturnDateMode] = useState<'today' | 'tomorrow' | 'custom'>('today')
  const [customDate, setCustomDate] = useState<string>('')
  const [lines, setLines] = useState<CheckoutLine[]>([])
  const [kitMessage, setKitMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Escape key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Default loggedBy to Saima (or first admin) when personnel loads
  useEffect(() => {
    if (personnel.length > 0 && loggedById === 0) {
      const saima = personnel.find((p) => p.name === 'Saima') ?? personnel[0]
      setLoggedById(saima.id)
    }
  }, [personnel, loggedById])

  const getReturnDate = useCallback((): string => {
    if (returnDateMode === 'today') return getTodayPkt()
    if (returnDateMode === 'tomorrow') return getTomorrowPkt()
    return customDate || getTodayPkt()
  }, [returnDateMode, customDate])

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: nextLineId(),
        serializedEquipmentId: null,
        countedInventoryId: null,
        quantity: 1,
        recipientId: loggedById || (personnel[0]?.id ?? 0),
      },
    ])
  }

  function removeLine(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  function updateLine(id: number, patch: Partial<CheckoutLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function applyKit(kitId: number) {
    if (!equipment) return
    const kit = kits.find((k) => k.id === kitId)
    if (!kit) return

    const newLines: CheckoutLine[] = []
    const skipped: string[] = []

    for (const item of kit.items) {
      if (item.type === 'serialized') {
        const available = equipment.serialized.find(
          (e) => e.category.toLowerCase() === item.category.toLowerCase() && e.status === 'Available'
        )
        if (available) {
          newLines.push({
            id: nextLineId(),
            serializedEquipmentId: available.id,
            countedInventoryId: null,
            quantity: 1,
            recipientId: loggedById || (personnel[0]?.id ?? 0),
          })
        } else {
          skipped.push(item.category)
        }
      } else {
        const pool = equipment.counted.find(
          (c) => c.category.toLowerCase() === item.category.toLowerCase()
        )
        if (pool && pool.availableQuantity >= item.quantity) {
          newLines.push({
            id: nextLineId(),
            serializedEquipmentId: null,
            countedInventoryId: pool.id,
            quantity: item.quantity,
            recipientId: loggedById || (personnel[0]?.id ?? 0),
          })
        } else {
          skipped.push(item.category)
        }
      }
    }

    setLines(newLines)
    if (skipped.length > 0) {
      setKitMessage(
        `Note: No available unit found for ${skipped.join(', ')}. Those lines were omitted — you can still proceed with the remaining items.`
      )
    } else {
      setKitMessage(null)
    }
  }

  async function handleSubmit() {
    if (lines.length === 0) return
    const expectedReturnDate = getReturnDate()
    if (returnDateMode === 'custom' && !customDate) {
      setConflictError('Please select a custom return date.')
      return
    }

    const requestLines: CheckoutLineRequestDto[] = lines.map((l) => ({
      serializedEquipmentId: l.serializedEquipmentId ?? undefined,
      countedInventoryId: l.countedInventoryId ?? undefined,
      quantity: l.quantity,
      recipientId: l.recipientId,
      expectedReturnDate,
    }))

    setSubmitting(true)
    setConflictError(null)
    try {
      const result = await createCheckout({ loggedById, lines: requestLines })
      const approvedCount = result.lines.filter((l) => l.status === 'PendingApproval').length
      if (approvedCount > 0) {
        setSuccessMsg(
          `Checkout submitted. ${approvedCount} restricted item(s) submitted for approval — pending Hamza's review.`
        )
      } else {
        setSuccessMsg('Equipment checkout logged successfully!')
      }
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (e) {
      if (e instanceof ApiError) {
        setConflictError(e.message)
      } else {
        setConflictError('Unexpected error occurred. Please refresh and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const loading = personnelLoading || equipLoading

  function allSerializedItems(): SerializedEquipmentDto[] {
    return equipment?.serialized ?? []
  }

  function allCountedItems(): CountedInventoryDto[] {
    return equipment?.counted ?? []
  }

  const isFormValid =
    lines.length > 0 &&
    lines.every(
      (l) => (l.serializedEquipmentId !== null || l.countedInventoryId !== null) && l.recipientId > 0 && l.quantity > 0
    ) &&
    (returnDateMode !== 'custom' || Boolean(customDate))

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="modal-dialog modal-fullscreen-sm-down modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content hor-modal-content border-0">
          {/* Modal Header */}
          <div className="hor-modal-header d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 44, height: 44, backgroundColor: '#EFF6FF', color: 'var(--hor-primary)' }}
              >
                <i className="bi bi-box-arrow-up-right fs-5" />
              </div>
              <div>
                <h5 id="checkout-modal-title" className="modal-title fw-bold text-dark mb-0">
                  New Equipment Checkout
                </h5>
                <p className="text-secondary small mb-0">
                  Assign serialized instruments and field inventory to team custody
                </p>
              </div>
            </div>
            <button
              id="checkout-close"
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close checkout modal"
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-3 p-md-4" style={{ backgroundColor: '#F8FAFC' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="text-muted small mt-2">Loading equipment and personnel catalog…</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {/* SECTION 1: Who is taking it */}
                <div className="card border p-3 shadow-sm bg-white">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold small"
                      style={{ width: 24, height: 24, backgroundColor: 'var(--hor-navy)', fontSize: '0.8rem' }}
                    >
                      1
                    </span>
                    <h6 className="fw-bold text-dark mb-0">Who is logging this checkout?</h6>
                  </div>

                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
                      <label htmlFor="checkout-loggedby" className="form-label small fw-semibold text-secondary mb-1">
                        Logged by (Supervisor / Custodian)
                      </label>
                      <select
                        id="checkout-loggedby"
                        className="form-select"
                        value={loggedById}
                        onChange={(e) => setLoggedById(Number(e.target.value))}
                      >
                        {personnel.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-2.5 rounded-3 bg-light border small text-secondary">
                        <i className="bi bi-info-circle me-1 text-primary" />
                        Items default to this custodian, but each line recipient can be assigned individually.
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: What are they taking */}
                <div className="card border p-3 shadow-sm bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold small"
                        style={{ width: 24, height: 24, backgroundColor: 'var(--hor-navy)', fontSize: '0.8rem' }}
                      >
                        2
                      </span>
                      <h6 className="fw-bold text-dark mb-0">What are they taking?</h6>
                    </div>
                    <button
                      id="add-line-btn"
                      type="button"
                      className="btn btn-sm btn-primary px-3"
                      onClick={addLine}
                    >
                      <i className="bi bi-plus-lg me-1" /> Add Line
                    </button>
                  </div>

                  {/* Kit Shortcuts as Cards */}
                  {kits.length > 0 && (
                    <div className="mb-3">
                      <span className="small fw-semibold text-muted text-uppercase d-block mb-2" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                        Quick Survey Kit Presets
                      </span>
                      <div className="row g-2">
                        {kits.map((k) => (
                          <div key={k.id} className="col-12 col-sm-6 col-md-4">
                            <button
                              id={`kit-btn-${k.id}`}
                              type="button"
                              className="btn btn-outline-secondary w-100 text-start p-2.5 d-flex align-items-start gap-2 h-100"
                              onClick={() => applyKit(k.id)}
                              style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                                style={{ width: 32, height: 32, backgroundColor: '#EFF6FF', color: '#2563EB' }}
                              >
                                <i className="bi bi-backpack2" />
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <div className="fw-semibold text-dark text-truncate small">{k.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  {k.items.length} {k.items.length === 1 ? 'item' : 'items'} preset
                                </div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                      {kitMessage && (
                        <div className="alert alert-warning py-2 px-3 small mt-2 mb-0 border-0 rounded-3 d-flex align-items-center gap-2">
                          <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                          <span>{kitMessage}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Lines */}
                  <div className="mt-2">
                    {lines.length === 0 ? (
                      <div className="text-center py-4 border rounded-3 bg-light text-muted">
                        <i className="bi bi-cart-plus fs-3 d-block mb-1 opacity-50" />
                        <span className="small">No items added yet. Click &ldquo;Add Line&rdquo; or pick a kit template above.</span>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {lines.map((line, idx) => {
                          const availSerialized = allSerializedItems()
                          const availCounted = allCountedItems()

                          // Check if currently selected serialized item requires approval
                          const selectedItem = line.serializedEquipmentId
                            ? availSerialized.find((e) => e.id === line.serializedEquipmentId)
                            : null
                          const isRestricted = selectedItem?.requiresApproval ?? false

                          return (
                            <div
                              key={line.id}
                              className="card p-3 border shadow-sm"
                              style={{ backgroundColor: '#F8FAFC' }}
                            >
                              <div className="row g-2 align-items-center">
                                {/* Item Picker */}
                                <div className="col-12 col-md-5">
                                  <label className="form-label small text-muted mb-1 d-md-none">Equipment</label>
                                  <select
                                    id={`line-${idx}-item-type`}
                                    className="form-select"
                                    value={
                                      line.serializedEquipmentId != null
                                        ? `s-${line.serializedEquipmentId}`
                                        : line.countedInventoryId != null
                                          ? `c-${line.countedInventoryId}`
                                          : ''
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (val.startsWith('s-')) {
                                        updateLine(line.id, {
                                          serializedEquipmentId: Number(val.slice(2)),
                                          countedInventoryId: null,
                                          quantity: 1,
                                        })
                                      } else if (val.startsWith('c-')) {
                                        updateLine(line.id, {
                                          countedInventoryId: Number(val.slice(2)),
                                          serializedEquipmentId: null,
                                        })
                                      } else {
                                        updateLine(line.id, {
                                          serializedEquipmentId: null,
                                          countedInventoryId: null,
                                        })
                                      }
                                    }}
                                  >
                                    <option value="">— Select equipment or inventory —</option>

                                    <optgroup label="Serialized Instruments">
                                      {availSerialized.map((e) => {
                                        const isOtherLineSelected = lines.some(
                                          (l) => l.id !== line.id && l.serializedEquipmentId === e.id
                                        )
                                        const isOutOrUnavailable =
                                          e.status !== 'Available' &&
                                          e.status !== 'PendingApproval' &&
                                          line.serializedEquipmentId !== e.id

                                        let disabledReason = ''
                                        if (isOtherLineSelected) disabledReason = ' (Selected in line)'
                                        else if (isOutOrUnavailable) disabledReason = ` (${e.status})`

                                        return (
                                          <option
                                            key={e.id}
                                            value={`s-${e.id}`}
                                            disabled={isOtherLineSelected || isOutOrUnavailable}
                                          >
                                            {e.name} {e.serialNumber ? `(#${e.serialNumber})` : ''}
                                            {e.requiresApproval ? ' ⚠ Approval Required' : ''}
                                            {disabledReason}
                                          </option>
                                        )
                                      })}
                                    </optgroup>

                                    <optgroup label="Counted Inventory">
                                      {availCounted.map((c) => (
                                        <option
                                          key={c.id}
                                          value={`c-${c.id}`}
                                          disabled={c.availableQuantity === 0}
                                        >
                                          {c.name} ({c.availableQuantity} available)
                                        </option>
                                      ))}
                                    </optgroup>
                                  </select>
                                </div>

                                {/* Quantity for Counted with Stepper */}
                                {line.countedInventoryId != null ? (
                                  <div className="col-4 col-md-2">
                                    <label className="form-label small text-muted mb-1 d-md-none">Quantity</label>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        type="button"
                                        className="hor-stepper-btn"
                                        disabled={line.quantity <= 1}
                                        onClick={() => updateLine(line.id, { quantity: Math.max(1, line.quantity - 1) })}
                                        aria-label="Decrease quantity"
                                      >
                                        -
                                      </button>
                                      <input
                                        id={`line-${idx}-qty`}
                                        type="number"
                                        className="form-control text-center tabular-nums p-1"
                                        min={1}
                                        max={
                                          availCounted.find((c) => c.id === line.countedInventoryId)?.availableQuantity ?? 99
                                        }
                                        value={line.quantity}
                                        onChange={(e) =>
                                          updateLine(line.id, { quantity: Math.max(1, Number(e.target.value)) })
                                        }
                                        style={{ minWidth: 44 }}
                                      />
                                      <button
                                        type="button"
                                        className="hor-stepper-btn"
                                        disabled={
                                          line.quantity >=
                                          (availCounted.find((c) => c.id === line.countedInventoryId)?.availableQuantity ?? 99)
                                        }
                                        onClick={() => updateLine(line.id, { quantity: line.quantity + 1 })}
                                        aria-label="Increase quantity"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="d-none d-md-block col-md-2 text-center text-muted small">
                                    <span className="badge bg-light text-secondary border">1 unit</span>
                                  </div>
                                )}

                                {/* Recipient Selector */}
                                <div className="col-8 col-md-4">
                                  <label className="form-label small text-muted mb-1 d-md-none">Recipient</label>
                                  <select
                                    id={`line-${idx}-recipient`}
                                    className="form-select"
                                    value={line.recipientId}
                                    onChange={(e) => updateLine(line.id, { recipientId: Number(e.target.value) })}
                                  >
                                    <option value={0}>— Recipient —</option>
                                    {personnel.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.role})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Remove Button */}
                                <div className="col-auto ms-auto">
                                  <button
                                    id={`remove-line-${idx}`}
                                    type="button"
                                    className="btn btn-outline-danger btn-sm p-1.5"
                                    onClick={() => removeLine(line.id)}
                                    title="Remove this line"
                                    aria-label={`Remove item line ${idx + 1}`}
                                  >
                                    <i className="bi bi-trash3" />
                                  </button>
                                </div>
                              </div>

                              {/* Restricted item warning */}
                              {isRestricted && (
                                <div className="mt-2 d-flex align-items-center gap-1.5 small text-indigo" style={{ color: '#4F46E5' }}>
                                  <i className="bi bi-shield-exclamation" />
                                  <span className="fw-medium">Restricted item: will be submitted for Approver review before release.</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: When is it due */}
                <div className="card border p-3 shadow-sm bg-white">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold small"
                      style={{ width: 24, height: 24, backgroundColor: 'var(--hor-navy)', fontSize: '0.8rem' }}
                    >
                      3
                    </span>
                    <h6 className="fw-bold text-dark mb-0">When is it due back?</h6>
                  </div>

                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-7">
                      <div className="btn-group w-100" role="group" aria-label="Return date options">
                        <button
                          id="return-date-today"
                          type="button"
                          className={`btn ${
                            returnDateMode === 'today' ? 'btn-primary' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setReturnDateMode('today')}
                        >
                          <i className="bi bi-calendar-event me-1" /> Today
                        </button>
                        <button
                          id="return-date-tomorrow"
                          type="button"
                          className={`btn ${
                            returnDateMode === 'tomorrow' ? 'btn-primary' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setReturnDateMode('tomorrow')}
                        >
                          <i className="bi bi-calendar-plus me-1" /> Tomorrow
                        </button>
                        <button
                          id="return-date-custom"
                          type="button"
                          className={`btn ${
                            returnDateMode === 'custom' ? 'btn-primary' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setReturnDateMode('custom')}
                        >
                          <i className="bi bi-calendar3 me-1" /> Pick a date
                        </button>
                      </div>
                    </div>

                    {returnDateMode === 'custom' && (
                      <div className="col-12 col-md-5">
                        <input
                          id="return-date-custom-input"
                          type="date"
                          className="form-control"
                          min={getTodayPkt()}
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Conflict / Error Alert */}
                {conflictError && (
                  <div
                    id="checkout-conflict-msg"
                    className="alert alert-danger d-flex align-items-center gap-2 mb-0 shadow-sm rounded-3"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-octagon-fill fs-5 flex-shrink-0" />
                    <div>
                      <strong>Conflict detected:</strong> {conflictError} — Please refresh the board and try again.
                    </div>
                  </div>
                )}

                {/* Success Alert */}
                {successMsg && (
                  <div className="alert alert-success d-flex align-items-center gap-2 mb-0 shadow-sm rounded-3" role="alert">
                    <i className="bi bi-check-circle-fill fs-5 flex-shrink-0" />
                    <div>{successMsg}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Sticky Footer */}
          <div className="hor-modal-footer d-flex align-items-center justify-content-between">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={submitting}>
              Cancel
            </button>

            <button
              id="checkout-submit"
              type="button"
              className="btn btn-primary px-4 shadow-sm"
              disabled={submitting || loading || !isFormValid}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Submitting Checkout…
                </>
              ) : (
                <>
                  <i className="bi bi-check2 me-1" /> Complete Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
