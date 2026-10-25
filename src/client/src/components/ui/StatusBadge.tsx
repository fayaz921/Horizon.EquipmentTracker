import type { ActiveCustodyLineDto, EquipmentStatus } from '../../types'

interface StatusBadgeProps {
  line?: ActiveCustodyLineDto
  status?: EquipmentStatus | 'Out' | 'DueToday' | 'Overdue' | string
  label?: string
  className?: string
}

export const StatusBadge = ({ line, status: explicitStatus, label, className = '' }: StatusBadgeProps) => {
  let badgeType: 'available' | 'dueToday' | 'overdue' | 'out' | 'pending' | 'inspection' | 'lost' | 'default' = 'default'
  let text = label || ''
  let icon = ''

  if (line) {
    if (line.isOverdue) {
      badgeType = 'overdue'
      text = line.daysDelinquent > 0 ? `${line.daysDelinquent} ${line.daysDelinquent === 1 ? 'day' : 'days'} overdue` : 'Overdue'
      icon = 'bi-exclamation-octagon-fill'
    } else if (line.isDueToday) {
      badgeType = 'dueToday'
      text = 'Due today'
      icon = 'bi-clock-fill'
    } else {
      badgeType = 'out'
      text = 'Out'
      icon = 'bi-box-arrow-up-right'
    }
  } else {
    const s = (explicitStatus || '').toLowerCase()
    if (s === 'available') {
      badgeType = 'available'
      text = label || 'Available'
      icon = 'bi-check-circle-fill'
    } else if (s === 'duetoday' || s === 'due today') {
      badgeType = 'dueToday'
      text = label || 'Due Today'
      icon = 'bi-clock-fill'
    } else if (s === 'overdue') {
      badgeType = 'overdue'
      text = label || 'Overdue'
      icon = 'bi-exclamation-octagon-fill'
    } else if (s === 'pendingapproval' || s === 'pending approval') {
      badgeType = 'pending'
      text = label || 'Pending Approval'
      icon = 'bi-hourglass-split'
    } else if (s === 'needsinspection' || s === 'needs inspection') {
      badgeType = 'inspection'
      text = label || 'Needs Inspection'
      icon = 'bi-tools'
    } else if (s === 'lost') {
      badgeType = 'lost'
      text = label || 'Lost'
      icon = 'bi-question-circle-fill'
    } else if (s === 'out') {
      badgeType = 'out'
      text = label || 'Out'
      icon = 'bi-box-arrow-up-right'
    } else {
      badgeType = 'default'
      text = label || explicitStatus || ''
      icon = 'bi-info-circle'
    }
  }

  const stylesByBadge = {
    available: {
      bg: '#ECFDF5',
      color: '#065F46',
      border: '#A7F3D0',
    },
    dueToday: {
      bg: '#FFFBEB',
      color: '#B45309',
      border: '#FDE68A',
    },
    overdue: {
      bg: '#FEF2F2',
      color: '#991B1B',
      border: '#FECACA',
    },
    out: {
      bg: '#EFF6FF',
      color: '#1E40AF',
      border: '#BFDBFE',
    },
    pending: {
      bg: '#EEF2FF',
      color: '#3730A3',
      border: '#C7D2FE',
    },
    inspection: {
      bg: '#FFF7ED',
      color: '#9A3412',
      border: '#FFEDD5',
    },
    lost: {
      bg: '#F8FAFC',
      color: '#475569',
      border: '#E2E8F0',
    },
    default: {
      bg: '#F1F5F9',
      color: '#334155',
      border: '#CBD5E1',
    },
  }[badgeType]

  return (
    <span
      className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-medium ${className}`}
      style={{
        fontSize: '0.75rem',
        backgroundColor: stylesByBadge.bg,
        color: stylesByBadge.color,
        border: `1px solid ${stylesByBadge.border}`,
        lineHeight: 1.2,
      }}
    >
      {icon && <i className={`bi ${icon}`} style={{ fontSize: '0.75rem' }} aria-hidden="true" />}
      <span>{text}</span>
    </span>
  )
}
