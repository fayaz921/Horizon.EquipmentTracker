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
      { id: nextLineId(), serializedEquipmentId: null, countedInventoryId: null, quantity: 1, recipientId: loggedById || (personnel[0]?.id ?? 0) },
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
        setSuccessMsg('Checkout successful!')
      }
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1800)
    } catch (e) {
      if (e instanceof ApiError) {
        setConflictError(e.message)
      } else {
        setConflictError('Unexpected error. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const loading = personnelLoading || equipLoading

  function availableSerializedForLine(currentId: number | null): SerializedEquipmentDto[] {
    if (!equipment) return []
    const selectedIds = lines
      .filter((l) => l.serializedEquipmentId !== null && l.serializedEquipmentId !== currentId)
      .map((l) => l.serializedEquipmentId!)
    return equipment.serialized.filter(
      (e) => (e.status === 'Available' || e.status === 'PendingApproval' || e.id === currentId) &&
        e.isActive &&
        !selectedIds.includes(e.id)
    )
  }

  function availableCounted(): CountedInventoryDto[] {
    return equipment?.counted ?? []
  }

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title fw-bold">Morning Checkout</h5>
            <button id="checkout-close" type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body">
            {loading && (
              <div className="text-center py-3">
                <div className="spinner-border text-success" role="status" />
              </div>
            )}

            {!loading && (
              <>
                {/* Logged by */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Logged by</label>
                  <select
                    id="checkout-loggedby"
                    className="form-select"
                    value={loggedById}
                    onChange={(e) => setLoggedById(Number(e.target.value))}
                  >
                    {personnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kit shortcut */}
                {kits.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Quick Kit Template</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {kits.map((k) => (
                        <button
                          key={k.id}
                          id={`kit-btn-${k.id}`}
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => applyKit(k.id)}
                        >
                          {k.name}
                        </button>
                      ))}
                    </div>
                    {kitMessage && (
                      <div className="alert alert-warning mt-2 py-2 small mb-0">{kitMessage}</div>
                    )}
                  </div>
                )}

                {/* Return date */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Return date (PKT)</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {(['today', 'tomorrow', 'custom'] as const).map((mode) => (
                      <button
                        key={mode}
                        id={`return-date-${mode}`}
                        type="button"
                        className={`btn ${returnDateMode === mode ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={() => setReturnDateMode(mode)}
                        style={{ minHeight: 44 }}
                      >
                        {mode === 'today' ? 'Today' : mode === 'tomorrow' ? 'Tomorrow' : 'Pick a date'}
                      </button>
                    ))}
                  </div>
                  {returnDateMode === 'custom' && (
                    <input
                      id="return-date-custom-input"
                      type="date"
                      className="form-control mt-2"
                      value={customDate}
                      min={getTodayPkt()}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  )}
                </div>

                {/* Equipment lines */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">Equipment lines</label>
                    <button id="add-line-btn" type="button" className="btn btn-sm btn-outline-primary" onClick={addLine}>
                      + Add Item
                    </button>
                  </div>

                  {lines.length === 0 && (
                    <p className="text-muted small">No items added. Use a kit template or add items manually.</p>
                  )}

                  {lines.map((line, idx) => {
                    const availSerialized = availableSerializedForLine(line.serializedEquipmentId)
                    const availCounted = availableCounted()

                    const isRestricted = line.serializedEquipmentId
                      ? equipment?.serialized.find((e) => e.id === line.serializedEquipmentId)?.requiresApproval
                      : false

                    return (
                      <div key={line.id} className="card mb-2 border-secondary">
                        <div className="card-body py-2 px-3">
                          <div className="row g-2 align-items-center">
                            <div className="col-12 col-md-4">
                              <select
                                id={`line-${idx}-item-type`}
                                className="form-select form-select-sm"
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
                                <option value="">— Select item —</option>
                                {availSerialized.length > 0 && (
                                  <optgroup label="Serialized Equipment">
                                    {availSerialized.map((e) => (
                                      <option key={e.id} value={`s-${e.id}`}>
                                        {e.name} {e.requiresApproval ? '⚠ Requires Approval' : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {availCounted.length > 0 && (
                                  <optgroup label="Counted Inventory">
                                    {availCounted.map((c) => (
                                      <option
                                        key={c.id}
                                        value={`c-${c.id}`}
                                        disabled={c.availableQuantity === 0}
                                      >
                                        {c.name} ({c.availableQuantity} avail)
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                            </div>

                            {/* Quantity — only for counted */}
                            {line.countedInventoryId != null && (
                              <div className="col-4 col-md-2">
                                <input
                                  id={`line-${idx}-qty`}
                                  type="number"
                                  className="form-control form-control-sm"
                                  min={1}
                                  max={
                                    availCounted.find((c) => c.id === line.countedInventoryId)
                                      ?.availableQuantity ?? 99
                                  }
                                  value={line.quantity}
                                  onChange={(e) =>
                                    updateLine(line.id, { quantity: Number(e.target.value) })
                                  }
                                />
                              </div>
                            )}

                            {/* Recipient */}
                            <div className="col-12 col-md-5">
                              <select
                                id={`line-${idx}-recipient`}
                                className="form-select form-select-sm"
                                value={line.recipientId}
                                onChange={(e) =>
                                  updateLine(line.id, { recipientId: Number(e.target.value) })
                                }
                              >
                                <option value={0}>— Recipient —</option>
                                {personnel.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="col-auto ms-auto">
                              <button
                                id={`remove-line-${idx}`}
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeLine(line.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {isRestricted && (
                            <div className="mt-1">
                              <span className="badge bg-info text-dark small">
                                Restricted item — will be submitted for Approver review, not immediately checked out
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 409 / conflict error */}
                {conflictError && (
                  <div className="alert alert-danger py-2 small" id="checkout-conflict-msg">
                    ⚠ {conflictError} — please refresh and try again.
                  </div>
                )}

                {/* Success */}
                {successMsg && (
                  <div className="alert alert-success py-2 small">{successMsg}</div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="checkout-submit"
              type="button"
              className="btn btn-success px-4"
              disabled={submitting || loading || lines.length === 0}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-1" />
              ) : null}
              Submit Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
