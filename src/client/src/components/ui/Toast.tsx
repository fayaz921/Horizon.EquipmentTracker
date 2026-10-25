export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  const typeConfig = {
    success: {
      icon: 'bi-check-circle-fill',
      color: '#10B981',
      bg: '#FFFFFF',
      border: '#A7F3D0',
    },
    error: {
      icon: 'bi-exclamation-triangle-fill',
      color: '#EF4444',
      bg: '#FFFFFF',
      border: '#FECACA',
    },
    warning: {
      icon: 'bi-exclamation-circle-fill',
      color: '#F59E0B',
      bg: '#FFFFFF',
      border: '#FDE68A',
    },
    info: {
      icon: 'bi-info-circle-fill',
      color: '#2563EB',
      bg: '#FFFFFF',
      border: '#BFDBFE',
    },
  }

  return (
    <div
      className="toast-container position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1090, maxWidth: 380 }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const config = typeConfig[toast.type]
        return (
          <div
            key={toast.id}
            className="toast show shadow-lg border-0 mb-2 rounded-3"
            role="alert"
            style={{
              backgroundColor: config.bg,
              borderLeft: `4px solid ${config.color}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="toast-header border-bottom-0 bg-transparent pt-3 px-3 pb-1">
              <i className={`bi ${config.icon} me-2`} style={{ color: config.color, fontSize: '1.1rem' }} />
              <strong className="me-auto text-dark" style={{ fontSize: '0.9rem' }}>
                {toast.title || (toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Success' : 'Notice')}
              </strong>
              <button
                type="button"
                className="btn-close ms-2"
                onClick={() => onDismiss(toast.id)}
                aria-label="Close"
              />
            </div>
            <div className="toast-body pt-0 px-3 pb-3 text-secondary small">
              {toast.message}
            </div>
          </div>
        )
      })}
    </div>
  )
}
