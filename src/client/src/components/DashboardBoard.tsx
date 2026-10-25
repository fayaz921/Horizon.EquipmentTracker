import type { ActiveCustodyLineDto, EquipmentAvailabilityDto } from '../types'
import { formatDate, formatTimestampPkt } from '../utils/dateUtils'
import { useBoardData } from '../hooks/useData'

interface DashboardBoardProps {
  onReturnClick?: (line: ActiveCustodyLineDto) => void
}

function StatusBadge({ line }: { line: ActiveCustodyLineDto }) {
  if (line.isOverdue)
    return <span className="badge bg-danger ms-1">Overdue {line.daysDelinquent}d</span>
  if (line.isDueToday)
    return <span className="badge bg-warning text-dark ms-1">Due Today</span>
  return <span className="badge bg-success ms-1">Out</span>
}

function ExtensionBadge({ count }: { count: number }) {
  if (count === 0) return null
  return <span className="badge bg-secondary ms-1">Ext. ({count})</span>
}

function CustodyTable({
  lines,
  onReturnClick,
}: {
  lines: ActiveCustodyLineDto[]
  onReturnClick?: (line: ActiveCustodyLineDto) => void
}) {
  if (lines.length === 0)
    return <p className="text-muted small">No active checkouts.</p>

  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle mb-0">
        <thead className="table-dark">
          <tr>
            <th>Holder</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Due</th>
            <th>Status</th>
            <th>Checked Out</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.lineId} className={l.isOverdue ? 'table-danger' : l.isDueToday ? 'table-warning' : ''}>
              <td className="fw-semibold">{l.recipientName}</td>
              <td>
                {l.serializedEquipmentName ?? l.countedInventoryName}
                {l.serialNumber && <span className="text-muted small ms-1">#{l.serialNumber}</span>}
              </td>
              <td>{l.countedInventoryId ? l.quantity : '—'}</td>
              <td>{formatDate(l.expectedReturnDate)}</td>
              <td>
                <StatusBadge line={l} />
                <ExtensionBadge count={l.extensionCount} />
              </td>
              <td className="text-muted small">{formatTimestampPkt(l.checkoutTimestamp)}</td>
              <td>
                {onReturnClick && (
                  <button
                    id={`return-btn-${l.lineId}`}
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => onReturnClick(l)}
                  >
                    Return
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InventoryPools({ equipment }: { equipment: EquipmentAvailabilityDto }) {
  return (
    <div className="row g-2 mb-3">
      {equipment.counted.map((c) => (
        <div key={c.id} className="col-6 col-md-3">
          <div className="card text-center border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="fs-3 fw-bold text-primary">{c.availableQuantity}</div>
              <div className="small text-muted">{c.name}</div>
              <div className="small">
                <span className="text-success">{c.availableQuantity} avail</span>
                {' / '}
                <span className="text-warning">{c.quantityOut} out</span>
                {c.quantityInInspection > 0 && (
                  <>
                    {' / '}
                    <span className="text-danger">{c.quantityInInspection} insp.</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SpecialStatusItems({ equipment }: { equipment: EquipmentAvailabilityDto }) {
  const special = equipment.serialized.filter((e) =>
    e.status === 'PendingApproval' || e.status === 'NeedsInspection' || e.status === 'Lost'
  )
  if (special.length === 0) return null

  const badgeClass: Record<string, string> = {
    PendingApproval: 'bg-info text-dark',
    NeedsInspection: 'bg-warning text-dark',
    Lost: 'bg-secondary',
  }
  const badgeLabel: Record<string, string> = {
    PendingApproval: 'Pending Approval',
    NeedsInspection: 'Needs Inspection',
    Lost: 'Lost',
  }

  return (
    <div className="mb-3">
      <h6 className="fw-bold text-secondary">Items Requiring Attention</h6>
      <div className="d-flex flex-wrap gap-2">
        {special.map((e) => (
          <span key={e.id} className={`badge fs-6 ${badgeClass[e.status] ?? 'bg-secondary'}`}>
            {e.name}
            <span className="ms-1 fw-normal">— {badgeLabel[e.status] ?? e.status}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DashboardBoard({ onReturnClick }: DashboardBoardProps) {
  const { custodyLines, equipment, loading, error, refresh } = useBoardData()

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading board…</p>
      </div>
    )

  if (error)
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={refresh}>Retry</button>
      </div>
    )

  const overdueCount = custodyLines.filter((l) => l.isOverdue).length
  const dueTodayCount = custodyLines.filter((l) => l.isDueToday).length

  return (
    <div>
      {/* Summary banner */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <h5 className="mb-0 fw-bold me-auto">Who Has What</h5>
        {overdueCount > 0 && (
          <span className="badge bg-danger fs-6">{overdueCount} Overdue</span>
        )}
        {dueTodayCount > 0 && (
          <span className="badge bg-warning text-dark fs-6">{dueTodayCount} Due Today</span>
        )}
        <button id="board-refresh" className="btn btn-sm btn-outline-secondary" onClick={refresh}>
          ↺ Refresh
        </button>
      </div>

      {/* Inventory pools */}
      {equipment && <InventoryPools equipment={equipment} />}

      {/* Items needing attention */}
      {equipment && <SpecialStatusItems equipment={equipment} />}

      {/* Active custody table */}
      <CustodyTable lines={custodyLines} onReturnClick={onReturnClick} />
    </div>
  )
}
