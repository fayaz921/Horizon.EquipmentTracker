interface NavbarProps {
  activeView: string
  onNav: (view: string) => void
  pendingCount?: number
}

export default function Navbar({ activeView, onNav, pendingCount = 0 }: NavbarProps) {
  return (
    <nav className="navbar navbar-dark bg-dark px-3 sticky-top">
      <span className="navbar-brand fw-bold">
        <span className="text-primary">Horizon</span> Equipment Tracker
      </span>
      <div className="d-flex gap-2">
        <button
          id="nav-board"
          className={`btn btn-sm ${activeView === 'board' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => onNav('board')}
        >
          Board
        </button>
        <button
          id="nav-checkout"
          className={`btn btn-sm ${activeView === 'checkout' ? 'btn-success' : 'btn-outline-light'}`}
          onClick={() => onNav('checkout')}
        >
          Checkout
        </button>
        <button
          id="nav-return"
          className={`btn btn-sm ${activeView === 'return' ? 'btn-warning' : 'btn-outline-light'} position-relative`}
          onClick={() => onNav('return')}
        >
          Return
        </button>
        {pendingCount > 0 && (
          <button
            id="nav-approvals"
            className={`btn btn-sm ${activeView === 'approvals' ? 'btn-danger' : 'btn-outline-danger'} position-relative`}
            onClick={() => onNav('approvals')}
          >
            Approvals
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {pendingCount}
            </span>
          </button>
        )}
      </div>
    </nav>
  )
}
