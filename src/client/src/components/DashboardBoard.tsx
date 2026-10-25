import { useState, useMemo } from 'react'
import type { ActiveCustodyLineDto, EquipmentAvailabilityDto } from '../types'
import { formatDate, formatTimestampPkt } from '../utils/dateUtils'
import { useBoardData } from '../hooks/useData'
import { Avatar, StatusBadge, KpiCard, EmptyState, PageHeader } from './ui'

interface DashboardBoardProps {
  onReturnClick?: (line: ActiveCustodyLineDto) => void
}

type FilterMode = 'all' | 'dueToday' | 'overdue' | 'pending' | 'inspection'

function ExtensionBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      className="badge rounded-pill bg-light text-secondary border ms-1 tabular-nums"
      title={`Extended ${count} ${count === 1 ? 'time' : 'times'}`}
    >
      Ext. ({count})
    </span>
  )
}

function BoardSkeleton() {
  return (
    <div className="placeholder-glow">
      {/* Header Skeleton */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="placeholder col-4 d-block mb-2" style={{ height: 28, width: 220 }} />
          <span className="placeholder col-6 d-block" style={{ height: 16, width: 340 }} />
        </div>
        <span className="placeholder col-2" style={{ height: 38, width: 100 }} />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="col-6 col-md">
            <div className="card p-3 border-0 shadow-sm" style={{ height: 90 }}>
              <span className="placeholder col-6 mb-2" />
              <span className="placeholder col-4" style={{ height: 28 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="card border-0 shadow-sm p-3">
        <div className="placeholder col-12 mb-3" style={{ height: 40 }} />
        <div className="placeholder col-12 mb-2" style={{ height: 32 }} />
        <div className="placeholder col-12 mb-2" style={{ height: 32 }} />
        <div className="placeholder col-12" style={{ height: 32 }} />
      </div>
    </div>
  )
}

function InventoryPools({ equipment }: { equipment: EquipmentAvailabilityDto }) {
  if (equipment.counted.length === 0) return null

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-boxes text-primary" aria-hidden="true" />
          <span>Counted Inventory Pools</span>
        </h6>
        <span className="small text-muted">{equipment.counted.length} categories tracked</span>
      </div>

      <div className="row g-3">
        {equipment.counted.map((c) => {
          const total = Math.max(c.totalQuantity, 1)
          const availPct = Math.round((c.availableQuantity / total) * 100)
          const outPct = Math.round((c.quantityOut / total) * 100)
          const inspPct = Math.round((c.quantityInInspection / total) * 100)

          return (
            <div key={c.id} className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 p-3 border shadow-sm">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-semibold text-dark mb-0">{c.name}</h6>
                    <span className="small text-muted">{c.category}</span>
                  </div>
                  <span className="fs-3 fw-bold tabular-nums text-primary" style={{ lineHeight: 1 }}>
                    {c.availableQuantity}
                  </span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="hor-segmented-progress my-2" title={`Available: ${c.availableQuantity}, Out: ${c.quantityOut}, In Inspection: ${c.quantityInInspection}`}>
                  <div className="hor-seg-avail" style={{ width: `${availPct}%` }} />
                  <div className="hor-seg-out" style={{ width: `${outPct}%` }} />
                  <div className="hor-seg-insp" style={{ width: `${inspPct}%` }} />
                </div>

                <div className="d-flex justify-content-between small text-secondary mt-1 tabular-nums">
                  <span className="d-flex align-items-center gap-1">
                    <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'var(--hor-green)' }} />
                    <strong className="text-dark">{c.availableQuantity}</strong> avail
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'var(--hor-amber)' }} />
                    <strong className="text-dark">{c.quantityOut}</strong> out
                  </span>
                  {c.quantityInInspection > 0 && (
                    <span className="d-flex align-items-center gap-1">
                      <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'var(--hor-orange)' }} />
                      <strong className="text-dark">{c.quantityInInspection}</strong> insp.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpecialStatusItems({ equipment }: { equipment: EquipmentAvailabilityDto }) {
  const special = equipment.serialized.filter(
    (e) => e.status === 'PendingApproval' || e.status === 'NeedsInspection' || e.status === 'Lost'
  )
  if (special.length === 0) return null

  const statusIcons: Record<string, string> = {
    PendingApproval: 'bi-hourglass-split',
    NeedsInspection: 'bi-tools',
    Lost: 'bi-question-circle',
  }

  const statusTones: Record<string, { bg: string; border: string; iconColor: string }> = {
    PendingApproval: { bg: '#EEF2FF', border: '#C7D2FE', iconColor: '#4F46E5' },
    NeedsInspection: { bg: '#FFF7ED', border: '#FFEDD5', iconColor: '#EA580C' },
    Lost: { bg: '#F8FAFC', border: '#E2E8F0', iconColor: '#475569' },
  }

  return (
    <div className="mb-4" id="items-requiring-attention">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-diamond text-amber" style={{ color: 'var(--hor-amber)' }} aria-hidden="true" />
          <span>Items Requiring Attention</span>
        </h6>
        <span className="badge rounded-pill bg-warning text-dark tabular-nums">{special.length}</span>
      </div>

      <div className="row g-2">
        {special.map((item) => {
          const tone = statusTones[item.status] ?? statusTones.Lost
          const icon = statusIcons[item.status] ?? 'bi-info-circle'

          return (
            <div key={item.id} className="col-12 col-sm-6 col-lg-4">
              <div
                className="card p-3 h-100 shadow-sm"
                style={{
                  backgroundColor: tone.bg,
                  border: `1px solid ${tone.border}`,
                }}
              >
                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: '#FFFFFF',
                      color: tone.iconColor,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <i className={`bi ${icon} fs-6`} aria-hidden="true" />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                      <span className="fw-semibold text-dark text-truncate" title={item.name}>
                        {item.name}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="d-flex align-items-center gap-2 small text-muted">
                      <span>{item.category}</span>
                      {item.serialNumber && (
                        <>
                          <span>•</span>
                          <span className="tabular-nums">#{item.serialNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardBoard({ onReturnClick }: DashboardBoardProps) {
  const { custodyLines, equipment, loading, error, refresh } = useBoardData()
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // KPI calculations
  const overdueCount = useMemo(() => custodyLines.filter((l) => l.isOverdue).length, [custodyLines])
  const dueTodayCount = useMemo(() => custodyLines.filter((l) => l.isDueToday).length, [custodyLines])
  const itemsOutCount = custodyLines.length
  const pendingCount = useMemo(
    () => equipment?.serialized.filter((e) => e.status === 'PendingApproval').length ?? 0,
    [equipment]
  )
  const inspectionCount = useMemo(() => {
    const serializedInsp = equipment?.serialized.filter((e) => e.status === 'NeedsInspection').length ?? 0
    const countedInsp = equipment?.counted.reduce((sum, c) => sum + (c.quantityInInspection > 0 ? 1 : 0), 0) ?? 0
    return serializedInsp + countedInsp
  }, [equipment])

  // Filtered Lines
  const filteredLines = useMemo(() => {
    return custodyLines.filter((line) => {
      // 1. KPI Filter
      if (filterMode === 'overdue' && !line.isOverdue) return false
      if (filterMode === 'dueToday' && !line.isDueToday) return false
      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const personMatch = line.recipientName.toLowerCase().includes(q)
        const itemMatch =
          (line.serializedEquipmentName?.toLowerCase().includes(q) ?? false) ||
          (line.countedInventoryName?.toLowerCase().includes(q) ?? false)
        const serialMatch = line.serialNumber?.toLowerCase().includes(q) ?? false
        if (!personMatch && !itemMatch && !serialMatch) return false
      }
      return true
    })
  }, [custodyLines, filterMode, searchQuery])

  if (loading) return <BoardSkeleton />

  if (error) {
    return (
      <div className="card p-4 border-danger border-opacity-25 bg-danger bg-opacity-10 shadow-sm my-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-3" />
            <div>
              <h6 className="fw-bold text-danger mb-0">Failed to load equipment data</h6>
              <p className="small text-danger mb-0 opacity-75">{error}</p>
            </div>
          </div>
          <button className="btn btn-sm btn-danger px-3" onClick={refresh}>
            <i className="bi bi-arrow-clockwise me-1" /> Retry
          </button>
        </div>
      </div>
    )
  }

  function handleKpiClick(mode: FilterMode) {
    if (filterMode === mode) {
      setFilterMode('all') // toggle off
    } else {
      setFilterMode(mode)
      if (mode === 'pending' || mode === 'inspection') {
        const el = document.getElementById('items-requiring-attention')
        el?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <PageHeader
        title="Operations Board"
        subtitle="Real-time equipment custody tracking, field loans, and inventory health"
        badge={
          overdueCount > 0 ? (
            <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle tabular-nums">
              {overdueCount} Overdue
            </span>
          ) : null
        }
        actions={
          <button
            id="board-refresh"
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={refresh}
            title="Refresh dashboard data"
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md">
          <KpiCard
            id="kpi-items-out"
            title="Items Out"
            count={itemsOutCount}
            icon="bi-box-arrow-up-right"
            tone="primary"
            isActive={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
          />
        </div>
        <div className="col-6 col-md">
          <KpiCard
            id="kpi-due-today"
            title="Due Today"
            count={dueTodayCount}
            icon="bi-clock-history"
            tone="amber"
            isActive={filterMode === 'dueToday'}
            onClick={() => handleKpiClick('dueToday')}
          />
        </div>
        <div className="col-6 col-md">
          <KpiCard
            id="kpi-overdue"
            title="Overdue"
            count={overdueCount}
            icon="bi-exclamation-triangle"
            tone="red"
            isActive={filterMode === 'overdue'}
            onClick={() => handleKpiClick('overdue')}
          />
        </div>
        <div className="col-6 col-md">
          <KpiCard
            id="kpi-awaiting-approval"
            title="Awaiting Approval"
            count={pendingCount}
            icon="bi-shield-exclamation"
            tone="indigo"
            isActive={filterMode === 'pending'}
            onClick={() => handleKpiClick('pending')}
          />
        </div>
        <div className="col-6 col-md">
          <KpiCard
            id="kpi-needs-inspection"
            title="Needs Inspection"
            count={inspectionCount}
            icon="bi-tools"
            tone="orange"
            isActive={filterMode === 'inspection'}
            onClick={() => handleKpiClick('inspection')}
          />
        </div>
      </div>

      {/* Counted Inventory Pools */}
      {equipment && <InventoryPools equipment={equipment} />}

      {/* Items Requiring Attention */}
      {equipment && <SpecialStatusItems equipment={equipment} />}

      {/* Active Custody Section */}
      <div className="card border shadow-sm">
        <div className="p-3 border-bottom bg-white rounded-top-3">
          <div className="row g-2 align-items-center justify-content-between">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-6">Active Checkouts</h5>
                <span className="badge rounded-pill bg-light text-secondary border tabular-nums">
                  {filteredLines.length} {filteredLines.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <div className="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
              {/* Search Box */}
              <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search" />
                </span>
                <input
                  id="board-search-input"
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search person or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className={`hor-chip ${filterMode === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterMode('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`hor-chip ${filterMode === 'dueToday' ? 'active' : ''}`}
                  onClick={() => setFilterMode('dueToday')}
                >
                  <span className="d-inline-block rounded-circle" style={{ width: 6, height: 6, backgroundColor: 'var(--hor-amber)' }} />
                  Due today
                </button>
                <button
                  type="button"
                  className={`hor-chip ${filterMode === 'overdue' ? 'active' : ''}`}
                  onClick={() => setFilterMode('overdue')}
                >
                  <span className="d-inline-block rounded-circle" style={{ width: 6, height: 6, backgroundColor: 'var(--hor-red)' }} />
                  Overdue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state check */}
        {filteredLines.length === 0 ? (
          <EmptyState
            icon={custodyLines.length === 0 ? 'bi-shield-check' : 'bi-search'}
            title={custodyLines.length === 0 ? 'No active checkouts' : 'No items found'}
            description={
              custodyLines.length === 0
                ? 'All field equipment is currently checked in and accounted for.'
                : 'No equipment records matched your active search query or filter.'
            }
            action={
              (filterMode !== 'all' || searchQuery) ? (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setFilterMode('all')
                    setSearchQuery('')
                  }}
                >
                  Reset filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                    <th className="ps-3 py-3" style={{ width: '22%' }}>Holder</th>
                    <th className="py-3" style={{ width: '25%' }}>Item</th>
                    <th className="py-3 text-center" style={{ width: '8%' }}>Qty</th>
                    <th className="py-3" style={{ width: '15%' }}>Due</th>
                    <th className="py-3" style={{ width: '15%' }}>Status</th>
                    <th className="py-3 text-muted" style={{ width: '15%' }}>Checked Out</th>
                    <th className="pe-3 py-3 text-end" style={{ width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLines.map((line) => {
                    const itemName = line.serializedEquipmentName ?? line.countedInventoryName ?? 'Item'
                    const rowClass = line.isOverdue
                      ? 'overdue-row'
                      : line.isDueToday
                        ? 'due-today-row'
                        : ''

                    return (
                      <tr key={line.lineId} className={rowClass}>
                        <td className="ps-3 py-2.5">
                          <div className="d-flex align-items-center gap-2.5">
                            <Avatar name={line.recipientName} size="md" />
                            <div>
                              <div className="fw-semibold text-dark leading-tight">{line.recipientName}</div>
                              {line.formattedRecipientPhone && (
                                <div className="text-muted small tabular-nums" style={{ fontSize: '0.75rem' }}>
                                  {line.formattedRecipientPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5">
                          <div className="fw-medium text-dark">{itemName}</div>
                          {line.serialNumber && (
                            <span className="badge bg-light text-secondary border tabular-nums" style={{ fontSize: '0.72rem' }}>
                              #{line.serialNumber}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 text-center">
                          <span className="tabular-nums fw-semibold text-dark">
                            {line.countedInventoryId ? line.quantity : '1'}
                          </span>
                        </td>

                        <td className="py-2.5">
                          <div className="tabular-nums fw-medium text-dark" style={{ fontSize: '0.875rem' }}>
                            {formatDate(line.expectedReturnDate)}
                          </div>
                        </td>

                        <td className="py-2.5">
                          <div className="d-flex align-items-center flex-wrap gap-1">
                            <StatusBadge line={line} />
                            <ExtensionBadge count={line.extensionCount} />
                          </div>
                        </td>

                        <td className="py-2.5 text-muted small tabular-nums" style={{ fontSize: '0.8rem' }}>
                          {formatTimestampPkt(line.checkoutTimestamp)}
                        </td>

                        <td className="pe-3 py-2.5 text-end">
                          {onReturnClick && (
                            <button
                              id={`return-btn-${line.lineId}`}
                              type="button"
                              className="btn btn-sm btn-outline-warning text-dark fw-semibold px-3"
                              onClick={() => onReturnClick(line)}
                            >
                              <i className="bi bi-arrow-return-left me-1" aria-hidden="true" />
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (< md) */}
            <div className="d-md-none p-2 d-flex flex-column gap-2">
              {filteredLines.map((line) => {
                const itemName = line.serializedEquipmentName ?? line.countedInventoryName ?? 'Item'
                const isOverdue = line.isOverdue

                return (
                  <div
                    key={line.lineId}
                    className={`card p-3 border shadow-sm ${isOverdue ? 'overdue-card' : ''}`}
                    style={{ backgroundColor: isOverdue ? '#FFF8F8' : '#FFFFFF' }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={line.recipientName} size="sm" />
                        <span className="fw-semibold text-dark">{line.recipientName}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <StatusBadge line={line} />
                        <ExtensionBadge count={line.extensionCount} />
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="fw-bold text-dark">{itemName}</div>
                      <div className="d-flex align-items-center gap-2 small text-muted">
                        {line.serialNumber && (
                          <span className="badge bg-light text-secondary border tabular-nums">
                            #{line.serialNumber}
                          </span>
                        )}
                        {line.countedInventoryId && (
                          <span className="tabular-nums">Qty: {line.quantity}</span>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between small text-muted mb-3 pt-2 border-top">
                      <span>Due: <strong className="text-dark tabular-nums">{formatDate(line.expectedReturnDate)}</strong></span>
                      <span className="tabular-nums">{formatTimestampPkt(line.checkoutTimestamp)}</span>
                    </div>

                    {onReturnClick && (
                      <button
                        id={`return-btn-${line.lineId}`}
                        type="button"
                        className="btn btn-amber w-100 fw-semibold"
                        style={{ minHeight: 44 }}
                        onClick={() => onReturnClick(line)}
                      >
                        <i className="bi bi-arrow-return-left me-1" aria-hidden="true" />
                        Process Return
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
