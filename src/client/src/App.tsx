import { useState, useEffect } from 'react'
import type { ActiveCustodyLineDto } from './types'
import Navbar from './components/Navbar'
import DashboardBoard from './components/DashboardBoard'
import CheckoutModal from './components/CheckoutModal'
import ReturnModal from './components/ReturnModal'
import { fetchPendingApprovals } from './api/apiClient'
import { ToastContainer, type ToastMessage } from './components/ui/Toast'

type View = 'board' | 'checkout' | 'return' | 'approvals'

export default function App() {
  const [view, setView] = useState<View>('board')
  const [boardKey, setBoardKey] = useState(0)
  const [preselectedReturnLine, setPreselectedReturnLine] = useState<ActiveCustodyLineDto | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  function addToast(type: ToastMessage['type'], title: string, message: string) {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    fetchPendingApprovals()
      .then((list) => setPendingCount(list.length))
      .catch(() => setPendingCount(0))
  }, [boardKey])

  function refreshBoard() {
    setBoardKey((k) => k + 1)
  }

  function handleReturnFromBoard(line: ActiveCustodyLineDto) {
    setPreselectedReturnLine(line)
    setView('return')
  }

  function handleCheckoutSuccess() {
    refreshBoard()
    setView('board')
    addToast('success', 'Checkout Complete', 'Equipment custody event successfully logged in the system.')
  }

  function handleReturnSuccess() {
    refreshBoard()
    addToast('success', 'Return Processed', 'Returned equipment has been restored to available inventory.')
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--hor-bg)' }}>
      <Navbar
        activeView={view}
        onNav={(v) => {
          if (v === 'approvals') {
            // For now, if approvals clicked, stay on board and focus items requiring attention
            setView('board')
            const el = document.getElementById('items-requiring-attention')
            el?.scrollIntoView({ behavior: 'smooth' })
          } else {
            setView(v as View)
          }
        }}
        pendingCount={pendingCount}
      />

      <main className="container-fluid flex-grow-1 py-4 px-3 px-md-4 pb-5 mb-5 mb-md-0" style={{ maxWidth: 1280 }}>
        <DashboardBoard
          key={boardKey}
          onReturnClick={handleReturnFromBoard}
        />
      </main>

      {/* Checkout Modal */}
      {view === 'checkout' && (
        <CheckoutModal
          onClose={() => setView('board')}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Return Modal */}
      {view === 'return' && (
        <ReturnModal
          onClose={() => {
            setPreselectedReturnLine(null)
            setView('board')
          }}
          onSuccess={handleReturnSuccess}
          preselectedLine={preselectedReturnLine}
        />
      )}

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
