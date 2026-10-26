import { useState, useEffect, useId, useCallback } from 'react'
import type { HistoryLineResponseDto, PersonnelDto, EquipmentAvailabilityDto } from '../types'
import { formatTimestampPkt } from '../utils/dateUtils'
import { fetchHistory, fetchPersonnel, fetchEquipment, ApiError } from '../api/apiClient'
import { PageHeader, EmptyState, Avatar } from './ui'

type PresetMode = 'this-month' | 'last-month' | 'custom'

export default function HistoryTab() {
  const [preset, setPreset] = useState<PresetMode>('this-month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [personId, setPersonId] = useState<number | ''>('')
  const [equipmentId, setEquipmentId] = useState<number | ''>('')

  const [historyLines, setHistoryLines] = useState<HistoryLineResponseDto[]>([])
  const [personnelList, setPersonnelList] = useState<PersonnelDto[]>([])
  const [equipmentList, setEquipmentList] = useState<EquipmentAvailabilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const personFilterId = useId()
  const equipmentFilterId = useId()
  const fromDateId = useId()
  const toDateId = useId()

  // Load dropdown filter data on mount
  useEffect(() => {
    Promise.all([fetchPersonnel(), fetchEquipment()])
      .then(([staff, equip]) => {
        setPersonnelList(staff)
        setEquipmentList(equip)
      })
      .catch(() => {
        // Dropdown loading failure non-fatal for main table
      })
  }, [])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: {
        preset?: string
        from?: string
        to?: string
        personId?: number
        equipmentId?: number
      } = {}

      if (preset === 'custom') {
        if (customFrom) params.from = customFrom
        if (customTo) params.to = customTo
      } else {
        params.preset = preset
      }

      if (personId) params.personId = Number(personId)
      if (equipmentId) params.equipmentId = Number(equipmentId)

      const data = await fetchHistory(params)
      setHistoryLines(data)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.problem.detail || 'Failed to load historical custody records.')
      } else {
        setError('Network error while querying history.')
      }
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo, personId, equipmentId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <div className="pb-5">
      <PageHeader
        title="Custody History"
        subtitle="Retrospective equipment loans, custody intervals, return condition logs, and audit trail"
        badge={
          <span className="badge rounded-pill bg-light text-secondary border tabular-nums">
            {historyLines.length} {historyLines.length === 1 ? 'record' : 'records'}
          </span>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={loadHistory}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Filter Toolbar Card */}
      <div className="card p-3 border shadow-sm mb-4 bg-white">
        <div className="row g-3 align-items-end">
          {/* Preset Buttons */}
          <div className="col-12 col-lg-4">
            <label className="form-label small fw-semibold text-dark mb-1">Time Range</label>
            <div className="btn-group btn-group-sm w-100" role="group">
              <button
                type="button"
                className={`btn ${preset === 'this-month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setPreset('this-month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`btn ${preset === 'last-month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setPreset('last-month')}
              >
                Last Month
              </button>
              <button
                type="button"
                className={`btn ${preset === 'custom' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setPreset('custom')}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Inputs (shown when custom is selected) */}
          {preset === 'custom' && (
            <div className="col-12 col-lg-3">
              <div className="row g-2">
                <div className="col-6">
                  <label htmlFor={fromDateId} className="form-label small text-muted mb-1">From</label>
                  <input
                    id={fromDateId}
                    type="date"
                    className="form-control form-control-sm"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label htmlFor={toDateId} className="form-label small text-muted mb-1">To</label>
                  <input
                    id={toDateId}
                    type="date"
                    className="form-control form-control-sm"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Person Filter */}
          <div className="col-12 col-sm-6 col-lg">
            <label htmlFor={personFilterId} className="form-label small fw-semibold text-dark mb-1">
              Holder (Person)
            </label>
            <select
              id={personFilterId}
              className="form-select form-select-sm"
              value={personId}
              onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Personnel</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Filter */}
          <div className="col-12 col-sm-6 col-lg">
            <label htmlFor={equipmentFilterId} className="form-label small fw-semibold text-dark mb-1">
              Equipment
            </label>
            <select
              id={equipmentFilterId}
              className="form-select form-select-sm"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Equipment</option>
              {equipmentList?.serialized && (
                <optgroup label="Serialized Equipment">
                  {equipmentList.serialized.map((eq) => (
                    <option key={`s-${eq.id}`} value={eq.id}>
                      {eq.name} ({eq.serialNumber})
                    </option>
                  ))}
                </optgroup>
              )}
              {equipmentList?.counted && (
                <optgroup label="Counted Inventory">
                  {equipmentList.counted.map((c) => (
                    <option key={`c-${c.id}`} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill fs-5" />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-danger px-3" onClick={loadHistory}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-5 border text-center shadow-sm">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" />
          <p className="text-muted mb-0">Loading historical custody logs...</p>
        </div>
      ) : historyLines.length === 0 ? (
        <div className="card border shadow-sm">
          <EmptyState
            icon="bi-clock-history"
            title="No history records found"
            description="No equipment checkout intervals matched the selected date window and filter settings."
          />
        </div>
      ) : (
        <div className="card border shadow-sm">
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr
                  className="text-secondary small fw-semibold text-uppercase"
                  style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}
                >
                  <th className="ps-3 py-3" style={{ width: '20%' }}>Holder</th>
                  <th className="py-3" style={{ width: '24%' }}>Item</th>
                  <th className="py-3" style={{ width: '16%' }}>Checked Out (PKT)</th>
                  <th className="py-3" style={{ width: '16%' }}>Returned (PKT)</th>
                  <th className="py-3" style={{ width: '10%' }}>Condition</th>
                  <th className="pe-3 py-3" style={{ width: '14%' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyLines.map((row) => {
                  const itemName = row.serializedEquipmentName ?? row.countedInventoryName ?? 'Item'
                  const isStillOut = !row.isClosed || !row.actualReturnTimestamp

                  return (
                    <tr key={row.lineId}>
                      {/* Holder */}
                      <td className="ps-3 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={row.recipientName} size="sm" />
                          <div>
                            <div className="fw-semibold text-dark">{row.recipientName}</div>
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                              by {row.loggedByName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Item */}
                      <td className="py-3">
                        <div className="fw-medium text-dark">{itemName}</div>
                        <div className="small text-muted d-flex align-items-center gap-1.5">
                          {row.serialNumber && (
                            <span className="badge bg-light text-secondary border tabular-nums">
                              #{row.serialNumber}
                            </span>
                          )}
                          {row.countedInventoryId && (
                            <span className="tabular-nums">Qty: {row.quantity}</span>
                          )}
                          {row.extensionCount > 0 && (
                            <span className="badge bg-light text-muted border tabular-nums">
                              Ext. ({row.extensionCount})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Checked out */}
                      <td className="py-3 small text-muted tabular-nums">
                        {formatTimestampPkt(row.checkoutTimestamp)}
                      </td>

                      {/* Returned */}
                      <td className="py-3 small tabular-nums">
                        {isStillOut ? (
                          <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-semibold">
                            Still out
                          </span>
                        ) : (
                          <span className="text-dark fw-medium">
                            {formatTimestampPkt(row.actualReturnTimestamp!)}
                          </span>
                        )}
                      </td>

                      {/* Condition */}
                      <td className="py-3">
                        {isStillOut ? (
                          <span className="text-muted">—</span>
                        ) : row.returnCondition === 'Good' ? (
                          <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-semibold">
                            Good
                          </span>
                        ) : row.returnCondition === 'Damaged' ? (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fw-semibold">
                            Damaged
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border">
                            {row.returnCondition || 'Closed'}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="pe-3 py-3 small text-secondary">
                        {row.conditionNotes ? (
                          <span title={row.conditionNotes} className="d-inline-block text-truncate" style={{ maxWidth: 180 }}>
                            {row.conditionNotes}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none p-3 d-flex flex-column gap-3">
            {historyLines.map((row) => {
              const itemName = row.serializedEquipmentName ?? row.countedInventoryName ?? 'Item'
              const isStillOut = !row.isClosed || !row.actualReturnTimestamp

              return (
                <div key={row.lineId} className="card p-3 border shadow-sm">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={row.recipientName} size="sm" />
                      <div>
                        <div className="fw-semibold text-dark">{row.recipientName}</div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                          by {row.loggedByName}
                        </div>
                      </div>
                    </div>
                    {isStillOut ? (
                      <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
                        Still out
                      </span>
                    ) : row.returnCondition === 'Good' ? (
                      <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
                        Good
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
                        {row.returnCondition || 'Closed'}
                      </span>
                    )}
                  </div>

                  <div className="fw-bold text-dark mb-1">{itemName}</div>
                  <div className="small text-muted mb-2">
                    {row.serialNumber && `#${row.serialNumber} • `}
                    {row.countedInventoryId && `Qty: ${row.quantity} • `}
                    Due: {row.expectedReturnDate}
                  </div>

                  <div className="small text-muted pt-2 border-top">
                    <div>Checked out: <strong className="text-dark tabular-nums">{formatTimestampPkt(row.checkoutTimestamp)}</strong></div>
                    <div>
                      Returned:{' '}
                      <strong className="text-dark tabular-nums">
                        {isStillOut ? 'Still out' : formatTimestampPkt(row.actualReturnTimestamp!)}
                      </strong>
                    </div>
                    {row.conditionNotes && (
                      <div className="text-secondary mt-1">
                        <em>Notes: {row.conditionNotes}</em>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
