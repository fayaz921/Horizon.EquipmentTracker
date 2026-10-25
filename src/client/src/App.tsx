import { useState } from 'react'
import type { ActiveCustodyLineDto } from './types'
import Navbar from './components/Navbar'
import DashboardBoard from './components/DashboardBoard'
import CheckoutModal from './components/CheckoutModal'
import ReturnModal from './components/ReturnModal'
import { fetchPendingApprovals } from './api/apiClient'
import { useEffect } from 'react'

type View = 'board' | 'checkout' | 'return'

export default function App() {
  const [view, setView] = useState<View>('board')
  const [boardKey, setBoardKey] = useState(0)
  const [preselectedReturnLine, setPreselectedReturnLine] = useState<ActiveCustodyLineDto | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

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

  return (
    <div className="min-vh-100 bg-light">
      <Navbar activeView={view} onNav={(v) => setView(v as View)} pendingCount={pendingCount} />

      <main className="container-fluid py-3 px-3 px-md-4" style={{ maxWidth: 1200 }}>
        {view === 'board' && (
          <DashboardBoard key={boardKey} onReturnClick={handleReturnFromBoard} />
        )}
      </main>

      {view === 'checkout' && (
        <CheckoutModal
          onClose={() => setView('board')}
          onSuccess={() => { refreshBoard(); setView('board') }}
        />
      )}

      {view === 'return' && (
        <ReturnModal
          onClose={() => { setPreselectedReturnLine(null); setView('board') }}
          onSuccess={refreshBoard}
          preselectedLine={preselectedReturnLine}
        />
      )}
    </div>
  )
}
