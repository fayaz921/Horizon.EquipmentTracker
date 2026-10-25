import { useState, useEffect } from 'react'
import type { ActiveCustodyLineDto, ReturnCondition } from '../types'
import { returnLine, ApiError, fetchActiveCustody } from '../api/apiClient'
import { formatDate } from '../utils/dateUtils'

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
      // if all done, trigger parent refresh
      const updatedStates = {
        ...lineStates,
        [line.lineId]: { ...lineStates[line.lineId], done: true },
      }
      const allDone = allLines.every((l) => updatedStates[l.lineId]?.done)
      if (allDone) {
        setTimeout(() => { onSuccess(); onClose() }, 800)
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
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title fw-bold text-dark">Process Returns</h5>
            <button id="return-close" type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {loading && (
              <div className="text-center py-3">
                <div className="spinner-border text-warning" role="status" />
              </div>
            )}

            {loadError && (
              <div className="alert alert-danger">{loadError}</div>
            )}

            {!loading && allLines.length === 0 && (
              <p className="text-muted">No active checkouts to return.</p>
            )}

            {!loading && sortedGroups.map(([recipientName, lines]) => (
              <div key={recipientName} className="mb-4">
                <h6 className="fw-bold border-bottom pb-1 text-warning-emphasis">
                  {recipientName}
                </h6>

                {lines.map((line) => {
                  const state = lineStates[line.lineId]
                  if (!state) return null
                  const isCounted = line.countedInventoryId != null
                  const itemName = line.serializedEquipmentName ?? line.countedInventoryName ?? 'Item'

                  if (state.done) {
                    return (
                      <div key={line.lineId} className="card mb-2 border-success bg-success bg-opacity-10">
                        <div className="card-body py-2 px-3 text-success small fw-semibold">
                          ✓ {itemName} returned
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={line.lineId} className={`card mb-2 ${line.isOverdue ? 'border-danger' : 'border-secondary'}`}>
                      <div className="card-body py-2 px-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="fw-semibold">{itemName}</span>
                            {line.serialNumber && (
                              <span className="text-muted small ms-1">#{line.serialNumber}</span>
                            )}
                            {line.isOverdue && (
                              <span className="badge bg-danger ms-2">Overdue {line.daysDelinquent}d</span>
                            )}
                            {line.isDueToday && !line.isOverdue && (
                              <span className="badge bg-warning text-dark ms-2">Due Today</span>
                            )}
                            <div className="text-muted small">Due: {formatDate(line.expectedReturnDate)}</div>
                          </div>
                          {isCounted && (
                            <div style={{ width: 80 }}>
                              <label className="form-label small mb-0">Qty (max {line.quantity})</label>
                              <input
                                id={`return-qty-${line.lineId}`}
                                type="number"
                                className="form-control form-control-sm"
                                min={1}
                                max={line.quantity}
                                value={state.quantity}
                                onChange={(e) =>
                                  updateState(line.lineId, { quantity: Number(e.target.value) })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Condition — required */}
                        <div className="d-flex gap-2 mb-2">
                          <span className="small fw-semibold me-1 align-self-center">Condition:</span>
                          {(['Good', 'Damaged'] as ReturnCondition[]).map((cond) => (
                            <button
                              key={cond}
                              id={`condition-${line.lineId}-${cond.toLowerCase()}`}
                              type="button"
                              className={`btn btn-sm ${
                                state.condition === cond
                                  ? cond === 'Good'
                                    ? 'btn-success'
                                    : 'btn-danger'
                                  : cond === 'Good'
                                    ? 'btn-outline-success'
                                    : 'btn-outline-danger'
                              }`}
                              style={{ minHeight: 40, minWidth: 80 }}
                              onClick={() => updateState(line.lineId, { condition: cond })}
                            >
                              {cond}
                            </button>
                          ))}
                        </div>

                        {/* Optional note */}
                        <div className="mb-2">
                          <input
                            id={`return-note-${line.lineId}`}
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Condition note (optional)"
                            value={state.conditionNotes}
                            onChange={(e) =>
                              updateState(line.lineId, { conditionNotes: e.target.value })
                            }
                          />
                        </div>

                        {state.error && (
                          <div className="alert alert-danger py-1 small mb-2" id={`return-error-${line.lineId}`}>
                            ⚠ {state.error}
                          </div>
                        )}

                        <button
                          id={`submit-return-${line.lineId}`}
                          type="button"
                          className="btn btn-warning btn-sm w-100 fw-bold"
                          disabled={!state.condition || state.submitting}
                          onClick={() => void submitReturn(line)}
                          style={{ minHeight: 44 }}
                        >
                          {state.submitting ? (
                            <span className="spinner-border spinner-border-sm me-1" />
                          ) : null}
                          Return {isCounted ? `${state.quantity}×` : ''}{itemName}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
