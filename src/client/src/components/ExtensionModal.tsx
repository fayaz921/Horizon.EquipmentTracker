import { useState, useEffect, useId } from 'react'
import type { ActiveCustodyLineDto, PersonnelDto } from '../types'
import { formatDate } from '../utils/dateUtils'
import { fetchPersonnel, extendCheckoutLine, ApiError } from '../api/apiClient'

interface ExtensionModalProps {
  line: ActiveCustodyLineDto
  onClose: () => void
  onSuccess: (updatedCount: number, message: string) => void
}

export default function ExtensionModal({ line, onClose, onSuccess }: ExtensionModalProps) {
  const [personnel, setPersonnel] = useState<PersonnelDto[]>([])
  const [extendedById, setExtendedById] = useState<number | ''>('')
  const [newDate, setNewDate] = useState<string>('')
  const [adminPin, setAdminPin] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingStaff, setFetchingStaff] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const dateInputId = useId()
  const grantedById = useId()
  const adminPinId = useId()

  const itemName = line.serializedEquipmentName ?? line.countedInventoryName ?? 'Equipment'

  useEffect(() => {
    fetchPersonnel()
      .then((data) => {
        setPersonnel(data)
        if (data.length > 0) {
          setExtendedById(data[0].id)
        }
      })
      .catch(() => {
        setError('Failed to load personnel list. Please try again.')
      })
      .finally(() => setFetchingStaff(false))

    // Calculate default new date: +1 day after current expectedReturnDate
    try {
      const parts = line.expectedReturnDate.split('-').map(Number)
      if (parts.length === 3) {
        const [y, m, d] = parts
        const curDate = new Date(Date.UTC(y, m - 1, d))
        curDate.setUTCDate(curDate.getUTCDate() + 1)
        setNewDate(curDate.toISOString().slice(0, 10))
      }
    } catch {
      setNewDate('')
    }
  }, [line.expectedReturnDate])

  function setPresetDays(days: number) {
    try {
      const parts = line.expectedReturnDate.split('-').map(Number)
      if (parts.length === 3) {
        const [y, m, d] = parts
        const target = new Date(Date.UTC(y, m - 1, d))
        target.setUTCDate(target.getUTCDate() + days)
        setNewDate(target.toISOString().slice(0, 10))
      }
    } catch {
      // fallback
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!newDate) {
      setError('Please select a new expected return date.')
      return
    }

    if (newDate <= line.expectedReturnDate) {
      setError(
        `New return date (${newDate}) must be later than the current due date (${line.expectedReturnDate}).`
      )
      return
    }

    if (!extendedById) {
      setError('Please select who granted the extension.')
      return
    }

    if (line.isOverdue && !adminPin.trim()) {
      setError('Admin PIN is required to extend an overdue item.')
      return
    }

    setLoading(true)
    try {
      const res = await extendCheckoutLine(
        line.lineId,
        {
          newExpectedReturnDate: newDate,
          extendedById: Number(extendedById),
        },
        line.isOverdue ? adminPin.trim() : undefined
      )
      onSuccess(res.extensionCount, res.message)
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(err.problem.detail || 'Unauthorized: Invalid Admin PIN.')
        } else if (err.status === 409) {
          setError(err.problem.detail || 'Conflict: Unable to extend this checkout line.')
        } else {
          setError(err.problem.detail || err.message || 'Extension failed.')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          {/* Header */}
          <div className="modal-header border-bottom py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: 'var(--hor-primary-light)',
                  color: 'var(--hor-primary)',
                }}
              >
                <i className="bi bi-calendar-plus fs-6" aria-hidden="true" />
              </div>
              <h5 className="modal-title fs-6 fw-bold text-dark mb-0">Extend Due Date</h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              disabled={loading}
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Asset Summary Banner */}
              <div
                className="p-3 rounded-3 mb-3 border"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div className="fw-semibold text-dark">{itemName}</div>
                    <div className="small text-muted">
                      Holder: <strong className="text-dark">{line.recipientName}</strong>
                      {line.serialNumber && ` • #${line.serialNumber}`}
                    </div>
                  </div>
                  {line.isOverdue ? (
                    <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
                      Overdue
                    </span>
                  ) : line.isDueToday ? (
                    <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle">
                      Due Today
                    </span>
                  ) : (
                    <span className="badge rounded-pill bg-light text-secondary border">
                      Active
                    </span>
                  )}
                </div>
                <div className="small text-muted mt-2 pt-2 border-top d-flex justify-content-between">
                  <span>Current Due: <strong className="text-dark">{formatDate(line.expectedReturnDate)}</strong></span>
                  <span>Previous Ext: <strong className="text-dark tabular-nums">{line.extensionCount}</strong></span>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  className="alert alert-danger py-2 px-3 small d-flex align-items-start gap-2 mb-3"
                  role="alert"
                >
                  <i className="bi bi-exclamation-octagon-fill flex-shrink-0 mt-0.5" />
                  <div className="flex-grow-1">{error}</div>
                </div>
              )}

              {/* Overdue Warning Callout */}
              {line.isOverdue && (
                <div
                  className="p-2.5 rounded-3 mb-3 small d-flex align-items-start gap-2"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                  }}
                >
                  <i className="bi bi-shield-lock-fill fs-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Overdue Item:</strong> Self-extension period has passed. Extending this checkout requires Admin PIN authorization.
                  </div>
                </div>
              )}

              {/* New Date Picker */}
              <div className="mb-3">
                <label htmlFor={dateInputId} className="form-label small fw-semibold text-dark mb-1">
                  New Expected Return Date <span className="text-danger">*</span>
                </label>
                <input
                  id={dateInputId}
                  type="date"
                  className="form-control"
                  min={line.expectedReturnDate}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
                <div className="d-flex align-items-center gap-1.5 mt-1.5">
                  <span className="small text-muted me-1">Fast presets:</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    style={{ fontSize: '0.75rem', minHeight: 24 }}
                    onClick={() => setPresetDays(1)}
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    style={{ fontSize: '0.75rem', minHeight: 24 }}
                    onClick={() => setPresetDays(3)}
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    style={{ fontSize: '0.75rem', minHeight: 24 }}
                    onClick={() => setPresetDays(7)}
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              {/* Granted By Personnel Select */}
              <div className="mb-3">
                <label htmlFor={grantedById} className="form-label small fw-semibold text-dark mb-1">
                  Granted by <span className="text-danger">*</span>
                </label>
                <select
                  id={grantedById}
                  className="form-select"
                  value={extendedById}
                  disabled={fetchingStaff}
                  onChange={(e) => setExtendedById(Number(e.target.value))}
                  required
                >
                  {fetchingStaff ? (
                    <option value="">Loading staff...</option>
                  ) : (
                    personnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Admin PIN (Only shown if line is overdue) */}
              {line.isOverdue && (
                <div className="mb-2">
                  <label htmlFor={adminPinId} className="form-label small fw-semibold text-danger mb-1">
                    Admin PIN <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-key" />
                    </span>
                    <input
                      id={adminPinId}
                      type="password"
                      className="form-control border-start-0"
                      placeholder="Enter Admin PIN"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className="form-text small text-muted">
                    Required for overdue extension security verification.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={loading}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary px-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Extending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2 me-1" />
                    Confirm Extension
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
