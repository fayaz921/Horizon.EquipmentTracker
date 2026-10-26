interface NavbarProps {
  activeView: string
  onNav: (view: string) => void
  pendingCount?: number
}

export default function Navbar({ activeView, onNav, pendingCount = 0 }: NavbarProps) {
  return (
    <>
      <header className="hor-navbar sticky-top px-3 py-2 text-white">
        <div className="container-fluid d-flex align-items-center justify-content-between" style={{ maxWidth: 1280 }}>
          {/* Logo & Brand */}
          <div
            className="d-flex align-items-center gap-2 text-decoration-none cursor-pointer user-select-none"
            role="button"
            tabIndex={0}
            onClick={() => onNav('board')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNav('board')
              }
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-2 text-white"
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              }}
            >
              <i className="bi bi-broadcast-pin fs-6" aria-hidden="true" />
            </div>
            <span className="fw-bold tracking-tight" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              Horizon <span style={{ color: '#93C5FD', fontWeight: 500 }}>Equipment Tracker</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="d-none d-md-flex align-items-center gap-2">
            <button
              id="nav-board"
              type="button"
              className={`btn btn-sm px-3 ${
                activeView === 'board'
                  ? 'btn-light text-dark fw-semibold'
                  : 'btn-link text-white text-decoration-none'
              }`}
              style={activeView !== 'board' ? { opacity: 0.85 } : undefined}
              onClick={() => onNav('board')}
            >
              <i className="bi bi-grid-1x2 me-1" aria-hidden="true" />
              Board
            </button>

            <button
              id="nav-approvals"
              type="button"
              className={`btn btn-sm px-3 ${
                activeView === 'approvals'
                  ? 'btn-light text-dark fw-semibold'
                  : 'btn-link text-white text-decoration-none'
              }`}
              style={activeView !== 'approvals' ? { opacity: 0.85 } : undefined}
              onClick={() => onNav('approvals')}
            >
              <i className="bi bi-shield-check me-1" aria-hidden="true" />
              Approvals
              {pendingCount > 0 && (
                <span className="badge rounded-pill bg-warning text-dark ms-1.5 tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="nav-history"
              type="button"
              className={`btn btn-sm px-3 ${
                activeView === 'history'
                  ? 'btn-light text-dark fw-semibold'
                  : 'btn-link text-white text-decoration-none'
              }`}
              style={activeView !== 'history' ? { opacity: 0.85 } : undefined}
              onClick={() => onNav('history')}
            >
              <i className="bi bi-clock-history me-1" aria-hidden="true" />
              History
            </button>

            <button
              id="nav-admin"
              type="button"
              className={`btn btn-sm px-3 ${
                activeView === 'admin'
                  ? 'btn-light text-dark fw-semibold'
                  : 'btn-link text-white text-decoration-none'
              }`}
              style={activeView !== 'admin' ? { opacity: 0.85 } : undefined}
              onClick={() => onNav('admin')}
            >
              <i className="bi bi-gear me-1" aria-hidden="true" />
              Admin
            </button>

            <div className="vr bg-white opacity-25 mx-1" style={{ height: 20 }} />

            <button
              id="nav-return"
              type="button"
              className={`btn btn-sm px-3 ${
                activeView === 'return'
                  ? 'btn-light text-dark fw-semibold'
                  : 'btn-link text-white text-decoration-none'
              }`}
              style={activeView !== 'return' ? { opacity: 0.85 } : undefined}
              onClick={() => onNav('return')}
            >
              <i className="bi bi-arrow-return-left me-1" aria-hidden="true" />
              Return
            </button>

            <button
              id="nav-checkout"
              type="button"
              className="btn btn-sm btn-primary px-3 shadow-sm"
              onClick={() => onNav('checkout')}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              New checkout
            </button>
          </div>

          {/* Mobile Right: Quick Tab Icons */}
          <div className="d-flex d-md-none align-items-center gap-1">
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${activeView === 'board' ? 'btn-light text-dark' : 'btn-link text-white'}`}
              onClick={() => onNav('board')}
              aria-label="Board"
            >
              <i className="bi bi-grid-1x2" />
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 position-relative ${activeView === 'approvals' ? 'btn-light text-dark' : 'btn-link text-white'}`}
              onClick={() => onNav('approvals')}
              aria-label="Approvals"
            >
              <i className="bi bi-shield-check" />
              {pendingCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark tabular-nums" style={{ fontSize: '0.65rem' }}>
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${activeView === 'history' ? 'btn-light text-dark' : 'btn-link text-white'}`}
              onClick={() => onNav('history')}
              aria-label="History"
            >
              <i className="bi bi-clock-history" />
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${activeView === 'admin' ? 'btn-light text-dark' : 'btn-link text-white'}`}
              onClick={() => onNav('admin')}
              aria-label="Admin"
            >
              <i className="bi bi-gear" />
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Bottom Action Bar for Mobile (< md) */}
      <div className="d-md-none hor-mobile-action-bar">
        <div className="row g-2">
          <div className="col-6">
            <button
              id="mobile-nav-return"
              type="button"
              className={`btn w-100 ${
                activeView === 'return' ? 'btn-warning text-dark' : 'btn-outline-secondary'
              }`}
              style={{ minHeight: 46 }}
              onClick={() => onNav('return')}
            >
              <i className="bi bi-arrow-return-left me-1" aria-hidden="true" />
              Return
            </button>
          </div>
          <div className="col-6">
            <button
              id="mobile-nav-checkout"
              type="button"
              className="btn btn-primary w-100 shadow-sm"
              style={{ minHeight: 46 }}
              onClick={() => onNav('checkout')}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              New Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
