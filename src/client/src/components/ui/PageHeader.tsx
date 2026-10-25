import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ReactNode
}

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
}: PageHeaderProps) => {
  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
      <div>
        <div className="d-flex align-items-center gap-2">
          <h1 className="h4 fw-bold mb-0 text-dark tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-secondary small mb-0 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
