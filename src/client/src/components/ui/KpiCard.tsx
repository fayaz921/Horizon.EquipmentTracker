export interface KpiCardProps {
  id?: string
  title: string
  count: number
  icon: string
  tone?: 'primary' | 'amber' | 'red' | 'indigo' | 'orange' | 'slate'
  isActive?: boolean
  onClick?: () => void
  subtitle?: string
}

export const KpiCard = ({
  id,
  title,
  count,
  icon,
  tone = 'primary',
  isActive = false,
  onClick,
  subtitle,
}: KpiCardProps) => {
  const toneColors = {
    primary: {
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      activeBorder: '#2563EB',
      activeBg: '#F8FAFC',
    },
    amber: {
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      activeBorder: '#D97706',
      activeBg: '#FFFDF5',
    },
    red: {
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      activeBorder: '#DC2626',
      activeBg: '#FFF8F8',
    },
    indigo: {
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      activeBorder: '#4F46E5',
      activeBg: '#F9FAFF',
    },
    orange: {
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      activeBorder: '#EA580C',
      activeBg: '#FFFBF7',
    },
    slate: {
      iconBg: '#F1F5F9',
      iconColor: '#475569',
      activeBorder: '#475569',
      activeBg: '#F8FAFC',
    },
  }[tone]

  return (
    <div
      id={id}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`hor-kpi-card p-3 rounded-3 bg-white h-100 ${
        isActive ? 'hor-kpi-active' : ''
      }`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: isActive ? `2px solid ${toneColors.activeBorder}` : '1px solid #E2E8F0',
        backgroundColor: isActive ? toneColors.activeBg : '#FFFFFF',
        boxShadow: isActive
          ? '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)'
          : '0 1px 3px 0 rgba(0,0,0,0.04)',
        transition: 'all 150ms ease-in-out',
      }}
      aria-pressed={onClick ? isActive : undefined}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-secondary fw-semibold small text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
          {title}
        </span>
        <div
          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{
            width: 34,
            height: 34,
            backgroundColor: toneColors.iconBg,
            color: toneColors.iconColor,
          }}
        >
          <i className={`bi ${icon} fs-6`} aria-hidden="true" />
        </div>
      </div>
      <div className="d-flex align-items-baseline gap-2">
        <span className="fs-3 fw-bold tabular-nums text-dark" style={{ lineHeight: 1.1 }}>
          {count}
        </span>
        {subtitle && <span className="small text-muted">{subtitle}</span>}
      </div>
    </div>
  )
}
