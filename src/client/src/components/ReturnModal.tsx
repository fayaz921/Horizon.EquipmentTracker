import { useState, useEffect } from 'react'
import type { ActiveCustodyLineDto, ReturnCondition } from '../types'
import { returnLine, ApiError, fetchActiveCustody } from '../api/apiClient'
import { formatDate } from '../utils/dateUtils'
import { Avatar, StatusBadge, EmptyState } from './ui'

interface ReturnModalProps {
  onClose: () => void
  onSuccess: () => void
  preselectedLine?: ActiveCustodyLineDto | null
}

interface ReturnLineState {
  lineId: number
  condition: ReturnCondition | ''
  conditionNotes: string
  quantity: number
  submitting: boolean
  error: string | null
  done: boolean
}

export default function ReturnModal({ onClose, onSuccess, preselectedLine }: ReturnModalProps) {
  const [allLines, setAllLines] = useState<ActiveCustodyLineDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lineStates, setLineStates] = useState<Record<number, ReturnLineState>>({})

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

  useEffect(() => {
    setLoading(true)
    fetchActiveCustody()
      .then((lines) => {
        setAllLines(lines)
        const states: Record<number, ReturnLineState> = {}
        for (const l of lines) {
          states[l.lineId] = {
            lineId: l.lineId,
            condition: '',
            conditionNotes: '',
            quantity: l.quantity,
            submitting: false,
            error: null,
            done: false,
          }
        }
        setLineStates(states)
      })
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : 'Failed to load active checkouts.')
      )
      .finally(() => setLoading(false))
  }, [])

  function updateState(lineId: number, patch: Partial<ReturnLineState>) {
    setLineStates((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], ...patch },
    }))
  }

  async function submitReturn(line: ActiveCustodyLineDto) {
    const state = lineStates[line.lineId]
    if (!state || !state.condition) return

    updateState(line.lineId, { submitting: true, error: null })
    try {
      await returnLine(line.lineId, {
        condition: state.condition as ReturnCondition,
        conditionNotes: state.conditionNotes || null,
        quantity: state.quantity,
      })
      updateState(line.lineId, { done: true, submitting: false })

      const updatedStates = {
        ...lineStates,
        [line.lineId]: { ...lineStates[line.lineId], done: true },
      }
      const allDone = allLines.every((l) => updatedStates[l.lineId]?.done)
      if (allDone) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 800)
      } else {
        onSuccess() // refresh board without closing
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Return failed. Please try again.'
      updateState(line.lineId, { submitting: false, error: msg })
    }
  }

  // Group lines by recipient name
  const grouped = allLines.reduce<Record<string, ActiveCustodyLineDto[]>>((acc, l) => {
    const key = l.recipientName
    if (!acc[key]) acc[key] = []
    acc[key].push(l)
    return acc
  }, {})

  // If preselected, show only that recipient's lines first
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (preselectedLine) {
      if (a === preselectedLine.recipientName) return -1
      if (b === preselectedLine.recipientName) return 1
    }
    return a.localeCompare(b)
  })

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div className="modal-dialog modal-fullscreen-sm-down modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content hor-modal-content border-0">
          {/* Header */}
          <div className="hor-modal-header d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 44, height: 44, backgroundColor: '#FFFBEB', color: 'var(--hor-amber)' }}
              >
                <i className="bi bi-arrow-return-left fs-5" />
              </div>
              <div>
                <h5 id="return-modal-title" className="modal-title fw-bold text-dark mb-0">
                  Process Equipment Return
                </h5>
                <p className="text-secondary small mb-0">
                  Inspect equipment condition and return custody to central inventory
                </p>
              </div>
            </div>
            <button
              id="return-close"
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close return modal"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-3 p-md-4" style={{ backgroundColor: '#F8FAFC' }}>
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status" />
                <p className="text-muted small mt-2">Loading active custody checkouts…</p>
              </div>
            )}

            {loadError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 shadow-sm" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5" />
                <div>{loadError}</div>
              </div>
            )}

            {!loading && allLines.length === 0 && (
              <EmptyState
                icon="bi-check2-circle"
                title="All equipment is in stock"
                description="There are currently no active checkouts in the field to be returned."
                action={
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                    Return to Board
                  </button>
                }
              />
            )}

            {!loading &&
              sortedGroups.map(([recipientName, lines]) => (
                <div key={recipientName} className="card border p-3 shadow-sm bg-white mb-4">
                  {/* Holder Header */}
                  <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
                    <div className="d-flex align-items-center gap-2.5">
                      <Avatar name={recipientName} size="md" />
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{recipientName}</h6>
                        <span className="small text-muted">{lines[0]?.formattedRecipientPhone || lines[0]?.recipientPhone}</span>
                      </div>
                    </div>
                    <span className="badge rounded-pill bg-light text-secondary border tabular-nums">
                      {lines.filter((l) => !lineStates[l.lineId]?.done).length} active {lines.filter((l) => !lineStates[l.lineId]?.done).length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Lines for this holder */}
                  <div className="d-flex flex-column gap-3">
                    {lines.map((line) => {
                      const state = lineStates[line.lineId]
                      if (!state) return null
                      const isCounted = line.countedInventoryId != null
                      const itemName = line.serializedEquipmentName ?? line.countedInventoryName ?? 'Item'

                      if (state.done) {
                        return (
                          <div
                            key={line.lineId}
                            className="p-3 rounded-3 border border-success-subtle bg-success-subtle d-flex align-items-center justify-content-between"
                          >
                            <div className="d-flex align-items-center gap-2 text-success">
                              <i className="bi bi-check-circle-fill fs-5" />
                              <span className="fw-semibold">
                                {itemName} returned successfully
                              </span>
                            </div>
                            <span className="badge bg-success">Complete</span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={line.lineId}
                          className={`card p-3 border shadow-sm ${line.isOverdue ? 'overdue-card' : ''}`}
                          style={{ backgroundColor: line.isOverdue ? '#FFF8F8' : '#F8FAFC' }}
                        >
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2 mb-3">
                            <div>
                              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h6 className="fw-bold text-dark mb-0">{itemName}</h6>
                                {line.serialNumber && (
                                  <span className="badge bg-white text-secondary border tabular-nums">
                                    #{line.serialNumber}
                                  </span>
                                )}
                                <StatusBadge line={line} />
                              </div>
                              <div className="small text-muted">
                                Expected Return: <strong className="text-dark tabular-nums">{formatDate(line.expectedReturnDate)}</strong>
                              </div>
                            </div>

                            {/* Quantity stepper for Counted items */}
                            {isCounted && (
                              <div className="d-flex align-items-center gap-2">
                                <label htmlFor={`return-qty-${line.lineId}`} className="form-label small text-muted mb-0">
                                  Return Qty:
                                </label>
                                <div className="d-flex align-items-center gap-1">
                                  <button
                                    type="button"
                                    className="hor-stepper-btn"
                                    disabled={state.quantity <= 1}
                                    onClick={() => updateState(line.lineId, { quantity: Math.max(1, state.quantity - 1) })}
                                    aria-label="Decrease return quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    id={`return-qty-${line.lineId}`}
                                    type="number"
                                    className="form-control text-center tabular-nums p-1"
                                    min={1}
                                    max={line.quantity}
                                    value={state.quantity}
                                    onChange={(e) =>
                                      updateState(line.lineId, {
                                        quantity: Math.min(line.quantity, Math.max(1, Number(e.target.value))),
                                      })
                                    }
                                    style={{ width: 48 }}
                                  />
                                  <button
                                    type="button"
                                    className="hor-stepper-btn"
                                    disabled={state.quantity >= line.quantity}
                                    onClick={() => updateState(line.lineId, { quantity: state.quantity + 1 })}
                                    aria-label="Increase return quantity"
                                  >
                                    +
                                  </button>
                                  <span className="small text-muted ms-1 tabular-nums">/ {line.quantity}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Condition Segmented Control */}
                          <div className="mb-2">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              Item Condition on Inspection:
                            </label>
                            <div className="btn-group w-100" role="group" aria-label="Item condition">
                              <button
                                id={`condition-${line.lineId}-good`}
                                type="button"
                                className={`btn ${
                                  state.condition === 'Good'
                                    ? 'btn-success text-white'
                                    : 'btn-outline-success'
                                }`}
                                style={{ minHeight: 40 }}
                                onClick={() => updateState(line.lineId, { condition: 'Good', conditionNotes: '' })}
                              >
                                <i className="bi bi-check2-circle me-1" /> Good Condition
                              </button>
                              <button
                                id={`condition-${line.lineId}-damaged`}
                                type="button"
                                className={`btn ${
                                  state.condition === 'Damaged'
                                    ? 'btn-danger text-white'
                                    : 'btn-outline-danger'
                                }`}
                                style={{ minHeight: 40 }}
                                onClick={() => updateState(line.lineId, { condition: 'Damaged' })}
                              >
                                <i className="bi bi-tools me-1" /> Damaged / Needs Inspection
                              </button>
                            </div>
                          </div>

                          {/* Optional note appearing ONLY when Damaged is chosen */}
                          {state.condition === 'Damaged' && (
                            <div className="mb-3 mt-2">
                              <label htmlFor={`return-note-${line.lineId}`} className="form-label small text-danger fw-semibold mb-1">
                                <i className="bi bi-exclamation-triangle me-1" />
                                Damage Details / Maintenance Notes (Required for repair team):
                              </label>
                              <input
                                id={`return-note-${line.lineId}`}
                                type="text"
                                className="form-control"
                                placeholder="e.g. Center locking collar stripped, cracked leg clasp..."
                                value={state.conditionNotes}
                                onChange={(e) => updateState(line.lineId, { conditionNotes: e.target.value })}
                                autoFocus
                              />
                            </div>
                          )}

                          {/* Error alert */}
                          {state.error && (
                            <div
                              id={`return-error-${line.lineId}`}
                              className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-2 rounded-3"
                              role="alert"
                            >
                              <i className="bi bi-exclamation-octagon-fill flex-shrink-0" />
                              <span>{state.error}</span>
                            </div>
                          )}

                          {/* Submit Button */}
                          <button
                            id={`submit-return-${line.lineId}`}
                            type="button"
                            className="btn btn-amber w-100 fw-semibold shadow-sm mt-1"
                            disabled={!state.condition || state.submitting}
                            onClick={() => void submitReturn(line)}
                            style={{ minHeight: 44 }}
                          >
                            {state.submitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                Processing Return…
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-return-left me-1" />
                                Return {isCounted ? `${state.quantity}× ` : ''}{itemName}
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="hor-modal-footer d-flex justify-content-end">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
