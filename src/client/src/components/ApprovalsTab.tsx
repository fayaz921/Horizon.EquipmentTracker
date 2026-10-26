import { useState, useEffect, useId } from 'react'
import type { PendingApprovalDto } from '../types'
import { formatDate, formatTimestampPkt } from '../utils/dateUtils'
import {
  fetchPendingApprovals,
  approvePendingRequest,
  cancelPendingRequest,
  ApiError,
} from '../api/apiClient'
import { EmptyState, PageHeader, Avatar } from './ui'

interface ApprovalsTabProps {
  onQueueUpdated?: () => void
  onToast?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void
}

interface ApproveModalState {
  item: PendingApprovalDto
}

export default function ApprovalsTab({ onQueueUpdated, onToast }: ApprovalsTabProps) {
  const [pendingList, setPendingList] = useState<PendingApprovalDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Approve Modal state
  const [approvingItem, setApprovingItem] = useState<ApproveModalState | null>(null)
  const [approverPin, setApproverPin] = useState('')
  const [submittingApprove, setSubmittingApprove] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  // Cancel action state
  const [cancellingLineId, setCancellingLineId] = useState<number | null>(null)

  const pinInputId = useId()

  async function loadPending() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPendingApprovals()
      setPendingList(data)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.problem.detail || 'Failed to load approvals queue.')
      } else {
        setError('Failed to connect to the server.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  function openApproveModal(item: PendingApprovalDto) {
    setApprovingItem({ item })
    setApproverPin('')
    setApproveError(null)
  }

  function closeApproveModal() {
    if (submittingApprove) return
    setApprovingItem(null)
    setApproverPin('')
    setApproveError(null)
  }

  async function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approvingItem) return
    if (!approverPin.trim()) {
      setApproveError('Please enter the Approver PIN.')
      return
    }

    setSubmittingApprove(true)
    setApproveError(null)

    try {
      const res = await approvePendingRequest(approvingItem.item.lineId, {
        approverPin: approverPin.trim(),
      })
      onToast?.(
        'success',
        'Request Approved',
        res.message || `${approvingItem.item.equipmentName} released to ${approvingItem.item.recipientName}.`
      )
      closeApproveModal()
      await loadPending()
      onQueueUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApproveError(err.problem.detail || err.problem.title || 'Approval rejected.')
      } else if (err instanceof Error) {
        setApproveError(err.message)
      } else {
        setApproveError('An unexpected error occurred during approval.')
      }
    } finally {
      setSubmittingApprove(false)
    }
  }

  async function handleCancel(item: PendingApprovalDto) {
    const confirmed = window.confirm(
      `Cancel pending request for "${item.equipmentName}"? This will return the asset to Available.`
    )
    if (!confirmed) return

    setCancellingLineId(item.lineId)
    try {
      const res = await cancelPendingRequest(item.lineId)
      onToast?.(
        'success',
        'Request Cancelled',
        res.message || `${item.equipmentName} request cancelled and restored to Available.`
      )
      await loadPending()
      onQueueUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        onToast?.('error', 'Cancellation Failed', err.problem.detail || 'Could not cancel request.')
      } else {
        onToast?.('error', 'Cancellation Failed', 'An unexpected error occurred.')
      }
    } finally {
      setCancellingLineId(null)
    }
  }

  return (
    <div className="pb-5">
      <PageHeader
        title="Approvals Queue"
        subtitle="Restricted equipment authorization queue requiring designated pilot or manager verification"
        badge={
          pendingList.length > 0 ? (
            <span className="badge rounded-pill bg-warning text-dark border border-warning tabular-nums">
              {pendingList.length} Pending
            </span>
          ) : null
        }
        actions={
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={loadPending}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill fs-5" />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-danger px-3" onClick={loadPending}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-5 border text-center shadow-sm">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" />
          <p className="text-muted mb-0">Loading pending requests...</p>
        </div>
      ) : pendingList.length === 0 ? (
        <div className="card border shadow-sm">
          <EmptyState
            icon="bi-shield-check"
            title="Approvals Queue Clear"
            description="There are currently no restricted equipment requests awaiting verification. All assets are either available or checked out."
          />
        </div>
      ) : (
        <div className="card border shadow-sm">
          <div className="p-3 border-bottom bg-white rounded-top-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-dark mb-0 fs-6">Pending Custody Authorizations</h5>
              <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle tabular-nums">
                {pendingList.length} awaiting approval
              </span>
            </div>
            <span className="small text-muted">Personal Approver PIN required</span>
          </div>

          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr
                  className="text-secondary small fw-semibold text-uppercase"
                  style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}
                >
                  <th className="ps-3 py-3" style={{ width: '25%' }}>Restricted Item</th>
                  <th className="py-3" style={{ width: '20%' }}>Requester</th>
                  <th className="py-3" style={{ width: '20%' }}>Designated Approver</th>
                  <th className="py-3" style={{ width: '15%' }}>Requested At</th>
                  <th className="py-3" style={{ width: '10%' }}>Expected Due</th>
                  <th className="pe-3 py-3 text-end" style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((item) => (
                  <tr key={item.lineId}>
                    <td className="ps-3 py-3">
                      <div className="fw-semibold text-dark">{item.equipmentName}</div>
                      <div className="small text-muted d-flex align-items-center gap-1.5">
                        <span className="badge bg-light text-secondary border">
                          #{item.serialNumber}
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={item.recipientName} size="sm" />
                        <div>
                          <div className="fw-medium text-dark">{item.recipientName}</div>
                          <div className="small text-muted">
                            Logged by: {item.loggedByName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-indigo-subtle border border-indigo-subtle">
                        <i className="bi bi-person-badge text-indigo" />
                        <span className="small fw-semibold text-dark">
                          {item.approverName || 'Licensed Approver'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 small text-muted tabular-nums">
                      {formatTimestampPkt(item.checkoutTimestamp)}
                    </td>

                    <td className="py-3 small text-dark tabular-nums fw-medium">
                      {formatDate(item.expectedReturnDate)}
                    </td>

                    <td className="pe-3 py-3 text-end">
                      <div className="d-inline-flex align-items-center gap-1.5">
                        <button
                          id={`approve-btn-${item.lineId}`}
                          type="button"
                          className="btn btn-sm btn-primary fw-semibold px-2.5"
                          style={{ minHeight: 32 }}
                          onClick={() => openApproveModal(item)}
                        >
                          <i className="bi bi-shield-check me-1" aria-hidden="true" />
                          Approve
                        </button>
                        <button
                          id={`cancel-approval-btn-${item.lineId}`}
                          type="button"
                          className="btn btn-sm btn-outline-danger fw-semibold px-2"
                          style={{ minHeight: 32 }}
                          disabled={cancellingLineId === item.lineId}
                          onClick={() => handleCancel(item)}
                          title="Cancel Request"
                        >
                          {cancellingLineId === item.lineId ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <i className="bi bi-x-lg" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="d-md-none p-3 d-flex flex-column gap-3">
            {pendingList.map((item) => (
              <div key={item.lineId} className="card p-3 border shadow-sm">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">{item.equipmentName}</h6>
                    <span className="small text-muted">
                      #{item.serialNumber} • {item.category}
                    </span>
                  </div>
                  <span className="badge rounded-pill bg-warning text-dark">
                    Needs Approval
                  </span>
                </div>

                <div className="small text-muted mb-2 pb-2 border-bottom">
                  <div>Requester: <strong className="text-dark">{item.recipientName}</strong></div>
                  <div>Approver: <strong className="text-dark">{item.approverName || 'Assigned Pilot'}</strong></div>
                  <div>Expected Return: <strong className="text-dark">{formatDate(item.expectedReturnDate)}</strong></div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-primary flex-grow-1 fw-semibold"
                    style={{ minHeight: 40 }}
                    onClick={() => openApproveModal(item)}
                  >
                    <i className="bi bi-shield-check me-1" />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger fw-semibold px-3"
                    style={{ minHeight: 40 }}
                    disabled={cancellingLineId === item.lineId}
                    onClick={() => handleCancel(item)}
                  >
                    {cancellingLineId === item.lineId ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      'Cancel'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Approver PIN Entry */}
      {approvingItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingApprove) closeApproveModal()
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: 'var(--hor-indigo-light)',
                      color: 'var(--hor-indigo)',
                    }}
                  >
                    <i className="bi bi-shield-lock-fill fs-6" aria-hidden="true" />
                  </div>
                  <h5 className="modal-title fs-6 fw-bold text-dark mb-0">Authorize Equipment Release</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  disabled={submittingApprove}
                  onClick={closeApproveModal}
                />
              </div>

              <form onSubmit={handleApproveSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 mb-3 border bg-light">
                    <div className="fw-semibold text-dark">{approvingItem.item.equipmentName}</div>
                    <div className="small text-muted">
                      Holder: <strong className="text-dark">{approvingItem.item.recipientName}</strong>
                    </div>
                    <div className="small text-muted">
                      Designated Approver: <strong className="text-dark">{approvingItem.item.approverName || 'Operator'}</strong>
                    </div>
                  </div>

                  {approveError && (
                    <div
                      className="alert alert-danger py-2 px-3 small d-flex align-items-start gap-2 mb-3"
                      role="alert"
                    >
                      <i className="bi bi-exclamation-octagon-fill flex-shrink-0 mt-0.5" />
                      <div className="flex-grow-1">{approveError}</div>
                    </div>
                  )}

                  <div className="mb-2">
                    <label htmlFor={pinInputId} className="form-label small fw-semibold text-dark mb-1">
                      Approver PIN <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <i className="bi bi-key" />
                      </span>
                      <input
                        id={pinInputId}
                        type="password"
                        className="form-control border-start-0"
                        placeholder="Enter personal Approver PIN"
                        value={approverPin}
                        onChange={(e) => setApproverPin(e.target.value)}
                        autoComplete="off"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-text small text-muted">
                      Strictly personal approver verification. Admin overrides are not permitted.
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={submittingApprove}
                    onClick={closeApproveModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary px-3"
                    disabled={submittingApprove}
                  >
                    {submittingApprove ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1" />
                        Verify & Release
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
