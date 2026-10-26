import { useState, useEffect } from 'react'
import type { ActiveCustodyLineDto } from './types'
import Navbar from './components/Navbar'
import DashboardBoard from './components/DashboardBoard'
import ApprovalsTab from './components/ApprovalsTab'
import HistoryTab from './components/HistoryTab'
import AdminTab from './components/AdminTab'
import CheckoutModal from './components/CheckoutModal'
import ReturnModal from './components/ReturnModal'
import { fetchPendingApprovals } from './api/apiClient'
import { ToastContainer, type ToastMessage } from './components/ui/Toast'

export default function App() {
  const [activeTab, setActiveTab] = useState<'board' | 'approvals' | 'history' | 'admin'>('board')
  const [modalView, setModalView] = useState<'checkout' | 'return' | null>(null)
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

  function updatePendingCount() {
    fetchPendingApprovals()
      .then((list) => setPendingCount(list.length))
      .catch(() => setPendingCount(0))
  }

  useEffect(() => {
    updatePendingCount()
  }, [boardKey])

  function refreshBoard() {
    setBoardKey((k) => k + 1)
    updatePendingCount()
  }

  function handleReturnFromBoard(line: ActiveCustodyLineDto) {
    setPreselectedReturnLine(line)
    setModalView('return')
  }

  function handleCheckoutSuccess() {
    refreshBoard()
    setModalView(null)
    addToast('success', 'Checkout Complete', 'Equipment custody event successfully logged in the system.')
  }

  function handleReturnSuccess() {
    refreshBoard()
    addToast('success', 'Return Processed', 'Returned equipment has been restored to available inventory.')
  }

  function handleNav(view: string) {
    if (view === 'checkout') {
      setModalView('checkout')
    } else if (view === 'return') {
      setPreselectedReturnLine(null)
      setModalView('return')
    } else if (view === 'board' || view === 'approvals' || view === 'history' || view === 'admin') {
      setActiveTab(view)
      setModalView(null)
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--hor-bg)' }}>
      <Navbar
        activeView={modalView ?? activeTab}
        onNav={handleNav}
        pendingCount={pendingCount}
      />

      <main className="container-fluid flex-grow-1 py-4 px-3 px-md-4 pb-5 mb-5 mb-md-0" style={{ maxWidth: 1280 }}>
        {activeTab === 'board' && (
          <DashboardBoard
            key={boardKey}
            onReturnClick={handleReturnFromBoard}
            onExtendSuccess={(msg) => {
              refreshBoard()
              addToast('success', 'Due Date Extended', msg)
            }}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsTab
            onQueueUpdated={refreshBoard}
            onToast={addToast}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            onToast={addToast}
            onCatalogUpdated={refreshBoard}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {modalView === 'checkout' && (
        <CheckoutModal
          onClose={() => setModalView(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Return Modal */}
      {modalView === 'return' && (
        <ReturnModal
          onClose={() => {
            setPreselectedReturnLine(null)
            setModalView(null)
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
