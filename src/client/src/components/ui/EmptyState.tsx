import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({
  icon = 'bi-inbox',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-5 px-3 ${className}`}>
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 text-secondary"
        style={{ width: 56, height: 56, backgroundColor: '#F1F5F9' }}
      >
        <i className={`bi ${icon} fs-3 text-muted`} aria-hidden="true" />
      </div>
      <h6 className="fw-semibold text-dark mb-1">{title}</h6>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
