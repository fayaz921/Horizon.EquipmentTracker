import { useState, useEffect, useId, useCallback } from 'react'
import type {
  EquipmentAvailabilityDto,
  PersonnelDto,
  ClearInspectionRequestDto,
  CreateEquipmentRequestDto,
  CreatePersonnelRequestDto,
  UpdatePersonnelRequestDto,
} from '../types'
import {
  fetchEquipment,
  fetchPersonnel,
  clearInspection,
  markAssetLost,
  adminCreateEquipment,
  adminUpdateEquipment,
  adminDeactivateEquipment,
  adminCreatePersonnel,
  adminUpdatePersonnel,
  adminDeactivatePersonnel,
  verifyAdminPin,
  ApiError,
} from '../api/apiClient'
import { PageHeader, EmptyState, Avatar } from './ui'

interface AdminTabProps {
  onToast?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void
  onCatalogUpdated?: () => void
}

type AdminSection = 'inspection' | 'equipment' | 'people'

export default function AdminTab({ onToast, onCatalogUpdated }: AdminTabProps) {
  // In-memory PIN only (never stored in localStorage or sessionStorage)
  const [adminPin, setAdminPin] = useState<string | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [verifyingPin, setVerifyingPin] = useState(false)

  const [activeSection, setActiveSection] = useState<AdminSection>('inspection')
  const [equipment, setEquipment] = useState<EquipmentAvailabilityDto | null>(null)
  const [personnel, setPersonnel] = useState<PersonnelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear Inspection modal state
  const [clearTarget, setClearTarget] = useState<{
    id: number
    name: string
    itemType: 'serialized' | 'counted'
    maxQty?: number
  } | null>(null)
  const [clearQty, setClearQty] = useState(1)
  const [clearNotes, setClearNotes] = useState('')
  const [clearLoading, setClearLoading] = useState(false)

  // Mark Lost modal state
  const [lostTarget, setLostTarget] = useState<{ id: number; name: string } | null>(null)
  const [lostNotes, setLostNotes] = useState('')
  const [lostLoading, setLostLoading] = useState(false)

  // Toggle Approval modal state
  const [approvalTarget, setApprovalTarget] = useState<{
    id: number
    name: string
    currentRequiresApproval: boolean
    currentApproverId: number | null
  } | null>(null)
  const [reqApproval, setReqApproval] = useState(false)
  const [approverId, setApproverId] = useState<number | ''>('')
  const [approvalLoading, setApprovalLoading] = useState(false)

  // Add Equipment modal state
  const [showAddEquip, setShowAddEquip] = useState(false)
  const [newEquipType, setNewEquipType] = useState<'serialized' | 'counted'>('serialized')
  const [newEquipName, setNewEquipName] = useState('')
  const [newEquipCategory, setNewEquipCategory] = useState('')
  const [newEquipSn, setNewEquipSn] = useState('')
  const [newEquipReqApprove, setNewEquipReqApprove] = useState(false)
  const [newEquipApproverId, setNewEquipApproverId] = useState<number | ''>('')
  const [newEquipQty, setNewEquipQty] = useState(1)
  const [addEquipLoading, setAddEquipLoading] = useState(false)

  // Personnel modal state (Add / Edit)
  const [personModalMode, setPersonModalMode] = useState<'add' | 'edit' | null>(null)
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null)
  const [personName, setPersonName] = useState('')
  const [personRole, setPersonRole] = useState('')
  const [personPhone, setPersonPhone] = useState('')
  const [personLoading, setPersonLoading] = useState(false)

  const pinGateInputId = useId()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [equipData, staffData] = await Promise.all([fetchEquipment(), fetchPersonnel()])
      setEquipment(equipData)
      setPersonnel(staffData)
    } catch {
      setError('Failed to load administrative catalog data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (adminPin) {
      loadData()
    }
  }, [adminPin, loadData])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    const entered = pinInput.trim()
    if (!entered) {
      setPinError('Please enter the Admin PIN.')
      return
    }
    setPinError(null)
    setVerifyingPin(true)
    try {
      await verifyAdminPin(entered)
      setAdminPin(entered)
      setPinInput('')
    } catch (err: unknown) {
      setPinInput('')
      if (err instanceof ApiError && err.status === 401) {
        setPinError('Invalid Admin PIN')
      } else if (err instanceof ApiError) {
        setPinError(err.problem?.detail || err.problem?.title || 'Invalid Admin PIN')
      } else {
        setPinError('Invalid Admin PIN')
      }
    } finally {
      setVerifyingPin(false)
    }
  }

  function handleLock() {
    setAdminPin(null)
    setPinInput('')
    setPinError(null)
  }

  // Inspection list
  const serializedInspection = equipment?.serialized.filter((e) => e.status === 'NeedsInspection') ?? []
  const countedInspection = equipment?.counted.filter((c) => c.quantityInInspection > 0) ?? []
  const totalInspectionItems = serializedInspection.length + countedInspection.length

  // Inspection clearance handler
  async function submitClearInspection(e: React.FormEvent) {
    e.preventDefault()
    if (!clearTarget || !adminPin) return
    setClearLoading(true)
    try {
      const body: ClearInspectionRequestDto = {
        itemType: clearTarget.itemType,
        resolutionNotes: clearNotes.trim() || null,
        quantity: clearTarget.itemType === 'counted' ? clearQty : 1,
      }
      const res = await clearInspection(clearTarget.id, body, adminPin)
      onToast?.('success', 'Inspection Cleared', res.message || `${clearTarget.name} restored to Available.`)
      setClearTarget(null)
      setClearNotes('')
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onToast?.('error', 'Unauthorized', 'Invalid Admin PIN. Please unlock again.')
          setAdminPin(null)
        } else {
          onToast?.('error', 'Clearance Failed', err.problem.detail || err.message)
        }
      } else {
        onToast?.('error', 'Clearance Failed', 'An unexpected error occurred.')
      }
    } finally {
      setClearLoading(false)
    }
  }

  // Mark Lost handler
  async function submitMarkLost(e: React.FormEvent) {
    e.preventDefault()
    if (!lostTarget || !adminPin) return
    setLostLoading(true)
    try {
      const res = await markAssetLost(lostTarget.id, { notes: lostNotes.trim() || null }, adminPin)
      onToast?.('warning', 'Asset Marked Lost', res.message || `${lostTarget.name} marked as Lost.`)
      setLostTarget(null)
      setLostNotes('')
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
          setAdminPin(null)
        } else {
          onToast?.('error', 'Mark Lost Failed', err.problem.detail || err.message)
        }
      } else {
        onToast?.('error', 'Mark Lost Failed', 'An unexpected error occurred.')
      }
    } finally {
      setLostLoading(false)
    }
  }

  // Toggle approval handler
  async function submitToggleApproval(e: React.FormEvent) {
    e.preventDefault()
    if (!approvalTarget || !adminPin) return
    setApprovalLoading(true)
    try {
      await adminUpdateEquipment(
        approvalTarget.id,
        {
          requiresApproval: reqApproval,
          approverId: reqApproval && approverId ? Number(approverId) : null,
        },
        adminPin
      )
      onToast?.(
        'success',
        'Approval Policy Updated',
        `Restricted approval setting for ${approvalTarget.name} updated successfully.`
      )
      setApprovalTarget(null)
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
          setAdminPin(null)
        } else {
          onToast?.('error', 'Update Failed', err.problem.detail || err.message)
        }
      } else {
        onToast?.('error', 'Update Failed', 'An unexpected error occurred.')
      }
    } finally {
      setApprovalLoading(false)
    }
  }

  // Deactivate equipment
  async function handleDeactivateEquipment(item: { id: number; name: string }) {
    if (!adminPin) return
    const confirmed = window.confirm(
      `Deactivate "${item.name}"? It will be removed from checkout rosters while preserving history.`
    )
    if (!confirmed) return

    try {
      await adminDeactivateEquipment(item.id, adminPin)
      onToast?.('success', 'Equipment Deactivated', `${item.name} has been soft-deleted.`)
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
        setAdminPin(null)
      } else {
        onToast?.('error', 'Deactivation Failed', 'Could not deactivate equipment.')
      }
    }
  }

  // Create equipment
  async function submitCreateEquipment(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPin) return
    setAddEquipLoading(true)
    try {
      const body: CreateEquipmentRequestDto = {
        itemType: newEquipType,
        name: newEquipName.trim(),
        category: newEquipCategory.trim(),
        serialNumber: newEquipType === 'serialized' ? newEquipSn.trim() : null,
        requiresApproval: newEquipType === 'serialized' ? newEquipReqApprove : false,
        approverId: newEquipType === 'serialized' && newEquipReqApprove && newEquipApproverId ? Number(newEquipApproverId) : null,
        totalQuantity: newEquipType === 'counted' ? Number(newEquipQty) : 1,
      }
      await adminCreateEquipment(body, adminPin)
      onToast?.('success', 'Equipment Created', `${body.name} added to catalog successfully.`)
      setShowAddEquip(false)
      setNewEquipName('')
      setNewEquipCategory('')
      setNewEquipSn('')
      setNewEquipReqApprove(false)
      setNewEquipApproverId('')
      setNewEquipQty(1)
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
          setAdminPin(null)
        } else {
          onToast?.('error', 'Creation Failed', err.problem.detail || err.message)
        }
      } else {
        onToast?.('error', 'Creation Failed', 'An unexpected error occurred.')
      }
    } finally {
      setAddEquipLoading(false)
    }
  }

  // Submit Person (Add or Edit)
  async function submitPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPin) return
    setPersonLoading(true)
    try {
      if (personModalMode === 'add') {
        const body: CreatePersonnelRequestDto = {
          name: personName.trim(),
          role: personRole.trim(),
          phoneNumber: personPhone.trim(),
        }
        await adminCreatePersonnel(body, adminPin)
        onToast?.('success', 'Personnel Added', `${body.name} added to staff roster.`)
      } else if (personModalMode === 'edit' && editingPersonId) {
        const body: UpdatePersonnelRequestDto = {
          name: personName.trim(),
          role: personRole.trim(),
          phoneNumber: personPhone.trim(),
        }
        await adminUpdatePersonnel(editingPersonId, body, adminPin)
        onToast?.('success', 'Personnel Updated', `${body.name} updated successfully.`)
      }
      setPersonModalMode(null)
      setPersonName('')
      setPersonRole('')
      setPersonPhone('')
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
          setAdminPin(null)
        } else {
          onToast?.('error', 'Operation Failed', err.problem.detail || err.message)
        }
      } else {
        onToast?.('error', 'Operation Failed', 'An unexpected error occurred.')
      }
    } finally {
      setPersonLoading(false)
    }
  }

  // Deactivate person
  async function handleDeactivatePerson(person: PersonnelDto) {
    if (!adminPin) return
    const confirmed = window.confirm(
      `Deactivate staff member "${person.name}"? Historical checkouts will remain intact.`
    )
    if (!confirmed) return

    try {
      await adminDeactivatePersonnel(person.id, adminPin)
      onToast?.('success', 'Person Deactivated', `${person.name} has been marked inactive.`)
      await loadData()
      onCatalogUpdated?.()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onToast?.('error', 'Unauthorized', 'Invalid Admin PIN.')
        setAdminPin(null)
      } else {
        onToast?.('error', 'Deactivation Failed', 'Could not deactivate personnel member.')
      }
    }
  }

  // ─── PIN GATE SCREEN ────────────────────────────────────────────────────────
  if (!adminPin) {
    return (
      <div className="py-5 d-flex justify-content-center align-items-center">
        <div className="card border shadow-sm p-4 text-center" style={{ maxWidth: 420, width: '100%', borderRadius: 16 }}>
          <div
            className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
            style={{
              width: 54,
              height: 54,
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
            }}
          >
            <i className="bi bi-shield-lock-fill fs-3" />
          </div>

          <h5 className="fw-bold text-dark mb-1">Administrative Authorization</h5>
          <p className="small text-muted mb-4">
            Enter the master Admin PIN to manage damaged equipment, catalog rules, and personnel records.
          </p>

          {pinError && (
            <div className="alert alert-danger py-2 px-3 small text-start mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {pinError}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div className="mb-3 text-start">
              <label htmlFor={pinGateInputId} className="form-label small fw-semibold text-dark mb-1">
                Admin PIN
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-key" />
                </span>
                <input
                  id={pinGateInputId}
                  type="password"
                  className="form-control border-start-0"
                  placeholder="Enter Admin PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  required
                  disabled={verifyingPin}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              style={{ minHeight: 42 }}
              disabled={verifyingPin}
            >
              {verifyingPin ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Verifying...
                </>
              ) : (
                <>
                  <i className="bi bi-unlock me-1" />
                  Unlock Controls
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── UNLOCKED ADMIN PANEL ───────────────────────────────────────────────────
  return (
    <div className="pb-5">
      <PageHeader
        title="Admin Controls"
        subtitle="Privileged catalog administration, damage inspection clearance, and personnel management"
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={loadData}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleLock}
              title="Lock Admin Session"
            >
              <i className="bi bi-lock me-1" />
              Lock Session
            </button>
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill fs-5" />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-danger px-3" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* Admin Section Tabs */}
      <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-2">
        <button
          type="button"
          className={`btn btn-sm px-3 ${activeSection === 'inspection' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveSection('inspection')}
        >
          <i className="bi bi-tools me-1.5" />
          Needs Inspection
          {totalInspectionItems > 0 && (
            <span className="badge rounded-pill bg-danger text-white ms-1.5 tabular-nums">
              {totalInspectionItems}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`btn btn-sm px-3 ${activeSection === 'equipment' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveSection('equipment')}
        >
          <i className="bi bi-boxes me-1.5" />
          Equipment Catalog
        </button>

        <button
          type="button"
          className={`btn btn-sm px-3 ${activeSection === 'people' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveSection('people')}
        >
          <i className="bi bi-people me-1.5" />
          People (Roster)
        </button>
      </div>

      {/* ─── 1. NEEDS INSPECTION SECTION ───────────────────────────────────── */}
      {activeSection === 'inspection' && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 fs-6">Damaged Equipment Awaiting Inspection</h5>
              <span className="small text-muted">Clear repaired gear back to the Available checkout pool</span>
            </div>
          </div>

          {totalInspectionItems === 0 ? (
            <div className="card border shadow-sm">
              <EmptyState
                icon="bi-check-circle"
                title="All Equipment Healthy"
                description="No serialized units or counted pools are currently marked damaged or awaiting inspection."
              />
            </div>
          ) : (
            <div className="card border shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                      <th className="ps-3 py-3" style={{ width: '35%' }}>Equipment</th>
                      <th className="py-3" style={{ width: '20%' }}>Type</th>
                      <th className="py-3" style={{ width: '20%' }}>Inspection Units</th>
                      <th className="pe-3 py-3 text-end" style={{ width: '25%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Serialized in inspection */}
                    {serializedInspection.map((item) => (
                      <tr key={`s-${item.id}`}>
                        <td className="ps-3 py-3">
                          <div className="fw-semibold text-dark">{item.name}</div>
                          <span className="small text-muted">#{item.serialNumber} • {item.category}</span>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-light text-secondary border">Serialized</span>
                        </td>
                        <td className="py-3">
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fw-semibold">
                            1 unit in inspection
                          </span>
                        </td>
                        <td className="pe-3 py-3 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success fw-semibold px-3"
                            onClick={() => {
                              setClearTarget({ id: item.id, name: item.name, itemType: 'serialized' })
                              setClearNotes('')
                            }}
                          >
                            <i className="bi bi-check2-circle me-1" />
                            Clear Inspection
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Counted in inspection */}
                    {countedInspection.map((pool) => (
                      <tr key={`c-${pool.id}`}>
                        <td className="ps-3 py-3">
                          <div className="fw-semibold text-dark">{pool.name}</div>
                          <span className="small text-muted">{pool.category}</span>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-light text-secondary border">Counted Pool</span>
                        </td>
                        <td className="py-3">
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fw-semibold tabular-nums">
                            {pool.quantityInInspection} {pool.quantityInInspection === 1 ? 'unit' : 'units'} in inspection
                          </span>
                        </td>
                        <td className="pe-3 py-3 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success fw-semibold px-3"
                            onClick={() => {
                              setClearTarget({
                                id: pool.id,
                                name: pool.name,
                                itemType: 'counted',
                                maxQty: pool.quantityInInspection,
                              })
                              setClearQty(pool.quantityInInspection)
                              setClearNotes('')
                            }}
                          >
                            <i className="bi bi-check2-circle me-1" />
                            Clear Inspection
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. EQUIPMENT CATALOG SECTION ─────────────────────────────────── */}
      {activeSection === 'equipment' && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 fs-6">Equipment Inventory</h5>
              <span className="small text-muted">Configure assets, toggle licensed approval gates, and manage lost equipment</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 shadow-sm"
              onClick={() => {
                setShowAddEquip(true)
                setNewEquipType('serialized')
                setNewEquipName('')
                setNewEquipCategory('')
                setNewEquipSn('')
                setNewEquipReqApprove(false)
                setNewEquipApproverId('')
                setNewEquipQty(1)
              }}
            >
              <i className="bi bi-plus-lg me-1" />
              Add Equipment
            </button>
          </div>

          {/* Serialized Gear Table */}
          <div className="card border shadow-sm mb-4">
            <div className="p-3 border-bottom bg-light bg-opacity-50">
              <h6 className="fw-bold text-dark mb-0">Individually Tracked Assets (Serialized)</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                    <th className="ps-3 py-3" style={{ width: '28%' }}>Item</th>
                    <th className="py-3" style={{ width: '16%' }}>Serial #</th>
                    <th className="py-3" style={{ width: '16%' }}>Status</th>
                    <th className="py-3" style={{ width: '20%' }}>Approval Gate</th>
                    <th className="pe-3 py-3 text-end" style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment?.serialized.map((item) => (
                    <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                      <td className="ps-3 py-2.5">
                        <div className="fw-semibold text-dark">{item.name}</div>
                        <span className="small text-muted">{item.category}</span>
                      </td>
                      <td className="py-2.5 small tabular-nums">
                        <span className="badge bg-light text-secondary border">#{item.serialNumber}</span>
                      </td>
                      <td className="py-2.5">
                        {!item.isActive ? (
                          <span className="badge rounded-pill bg-secondary text-white">Deactivated</span>
                        ) : item.status === 'Available' ? (
                          <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">Available</span>
                        ) : item.status === 'Out' ? (
                          <span className="badge rounded-pill bg-amber-subtle text-dark border border-amber-subtle" style={{ backgroundColor: '#FEF3C7' }}>Out</span>
                        ) : item.status === 'PendingApproval' ? (
                          <span className="badge rounded-pill bg-indigo-subtle text-indigo border" style={{ color: '#4F46E5', backgroundColor: '#EEF2FF' }}>Pending Approval</span>
                        ) : item.status === 'NeedsInspection' ? (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">Needs Inspection</span>
                        ) : (
                          <span className="badge rounded-pill bg-dark text-white">Lost</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.requiresApproval ? (
                          <span className="badge rounded-pill bg-indigo-subtle text-indigo border" style={{ color: '#4F46E5', backgroundColor: '#EEF2FF' }}>
                            <i className="bi bi-shield-lock me-1" />
                            Requires Approval
                          </span>
                        ) : (
                          <span className="small text-muted">Open Checkout</span>
                        )}
                      </td>
                      <td className="pe-3 py-2.5 text-end">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-2 py-1"
                            style={{ fontSize: '0.75rem', minHeight: 28 }}
                            onClick={() => {
                              setApprovalTarget({
                                id: item.id,
                                name: item.name,
                                currentRequiresApproval: item.requiresApproval,
                                currentApproverId: null,
                              })
                              setReqApproval(item.requiresApproval)
                              setApproverId('')
                            }}
                            title="Toggle Approval Policy"
                          >
                            <i className="bi bi-shield me-1" />
                            Gate
                          </button>
                          {item.status !== 'Lost' && item.isActive && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger px-2 py-1"
                              style={{ fontSize: '0.75rem', minHeight: 28 }}
                              onClick={() => {
                                setLostTarget({ id: item.id, name: item.name })
                                setLostNotes('')
                              }}
                              title="Mark Asset Lost"
                            >
                              Lost
                            </button>
                          )}
                          {item.isActive && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary px-2 py-1"
                              style={{ fontSize: '0.75rem', minHeight: 28 }}
                              onClick={() => handleDeactivateEquipment(item)}
                              title="Deactivate item"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Counted Pools Table */}
          <div className="card border shadow-sm">
            <div className="p-3 border-bottom bg-light bg-opacity-50">
              <h6 className="fw-bold text-dark mb-0">Counted Inventory Pools</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                    <th className="ps-3 py-3" style={{ width: '35%' }}>Pool Name</th>
                    <th className="py-3" style={{ width: '25%' }}>Category</th>
                    <th className="py-3 text-center" style={{ width: '20%' }}>Total / Available</th>
                    <th className="pe-3 py-3 text-end" style={{ width: '20%' }}>In Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment?.counted.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-3 py-2.5 fw-semibold text-dark">{c.name}</td>
                      <td className="py-2.5 small text-muted">{c.category}</td>
                      <td className="py-2.5 text-center tabular-nums">
                        <strong className="text-success">{c.availableQuantity}</strong> / {c.totalQuantity} total
                      </td>
                      <td className="pe-3 py-2.5 text-end tabular-nums">
                        {c.quantityInInspection > 0 ? (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
                            {c.quantityInInspection} units
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. PEOPLE (ROSTER) SECTION ───────────────────────────────────── */}
      {activeSection === 'people' && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 fs-6">Personnel Roster</h5>
              <span className="small text-muted">Manage staff members, roles, and Pakistani mobile numbers</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 shadow-sm"
              onClick={() => {
                setPersonModalMode('add')
                setEditingPersonId(null)
                setPersonName('')
                setPersonRole('')
                setPersonPhone('+92 300 ')
              }}
            >
              <i className="bi bi-person-plus me-1" />
              Add Person
            </button>
          </div>

          <div className="card border shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                    <th className="ps-3 py-3" style={{ width: '30%' }}>Staff Member</th>
                    <th className="py-3" style={{ width: '25%' }}>Role</th>
                    <th className="py-3" style={{ width: '25%' }}>Phone Number</th>
                    <th className="pe-3 py-3 text-end" style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.map((p) => (
                    <tr key={p.id} className={!p.isActive ? 'opacity-50' : ''}>
                      <td className="ps-3 py-2.5">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={p.name} size="sm" />
                          <div>
                            <div className="fw-semibold text-dark">{p.name}</div>
                            {!p.isActive && <span className="badge bg-secondary text-white small">Inactive</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 small text-secondary">{p.role}</td>
                      <td className="py-2.5 small tabular-nums text-dark fw-medium">
                        {p.phoneNumber || '—'}
                      </td>
                      <td className="pe-3 py-2.5 text-end">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-2 py-1"
                            style={{ fontSize: '0.75rem', minHeight: 28 }}
                            onClick={() => {
                              setPersonModalMode('edit')
                              setEditingPersonId(p.id)
                              setPersonName(p.name)
                              setPersonRole(p.role)
                              setPersonPhone(p.phoneNumber)
                            }}
                          >
                            <i className="bi bi-pencil me-1" />
                            Edit
                          </button>
                          {p.isActive && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger px-2 py-1"
                              style={{ fontSize: '0.75rem', minHeight: 28 }}
                              onClick={() => handleDeactivatePerson(p)}
                              title="Deactivate staff member"
                            >
                              <i className="bi bi-person-x" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Clear Inspection ───────────────────────────────────────── */}
      {clearTarget && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fs-6 fw-bold text-dark mb-0">Clear Equipment from Inspection</h5>
                <button type="button" className="btn-close" disabled={clearLoading} onClick={() => setClearTarget(null)} />
              </div>
              <form onSubmit={submitClearInspection}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 mb-3 border bg-light">
                    <div className="fw-semibold text-dark">{clearTarget.name}</div>
                    <span className="small text-muted">Will transition back to Available pool for field checkouts.</span>
                  </div>

                  {clearTarget.itemType === 'counted' && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Quantity to Clear (Max {clearTarget.maxQty})
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        max={clearTarget.maxQty || 1}
                        value={clearQty}
                        onChange={(e) => setClearQty(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Resolution Notes (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Cleaned optics, recalibrated, or replaced mounting screw"
                      value={clearNotes}
                      onChange={(e) => setClearNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={clearLoading} onClick={() => setClearTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success px-3" disabled={clearLoading}>
                    {clearLoading ? 'Clearing...' : 'Confirm Clearance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Mark Lost ─────────────────────────────────────────────── */}
      {lostTarget && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fs-6 fw-bold text-danger mb-0">Mark Asset as Lost</h5>
                <button type="button" className="btn-close" disabled={lostLoading} onClick={() => setLostTarget(null)} />
              </div>
              <form onSubmit={submitMarkLost}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 mb-3 border bg-danger bg-opacity-10 text-danger small">
                    <i className="bi bi-exclamation-triangle-fill me-1" />
                    Marking <strong>{lostTarget.name}</strong> as Lost will permanently transition the item to Lost status and close any open checkout loan.
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Loss Notes / Incident Details (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Unrecovered at site B, report filed"
                      value={lostNotes}
                      onChange={(e) => setLostNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={lostLoading} onClick={() => setLostTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-danger px-3" disabled={lostLoading}>
                    {lostLoading ? 'Marking...' : 'Confirm Mark Lost'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Toggle Approval ────────────────────────────────────────── */}
      {approvalTarget && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fs-6 fw-bold text-dark mb-0">Configure Approval Gate</h5>
                <button type="button" className="btn-close" disabled={approvalLoading} onClick={() => setApprovalTarget(null)} />
              </div>
              <form onSubmit={submitToggleApproval}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 mb-3 border bg-light">
                    <div className="fw-semibold text-dark">{approvalTarget.name}</div>
                    <span className="small text-muted">Controls whether checking out this asset enters the Pending Approvals queue.</span>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="approvalToggleSwitch"
                      checked={reqApproval}
                      onChange={(e) => setReqApproval(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold text-dark small" htmlFor="approvalToggleSwitch">
                      Require Licensed Operator Approval
                    </label>
                  </div>

                  {reqApproval && (
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Designated Approver
                      </label>
                      <select
                        className="form-select"
                        value={approverId}
                        onChange={(e) => setApproverId(e.target.value ? Number(e.target.value) : '')}
                        required
                      >
                        <option value="">Select licensed approver...</option>
                        {personnel.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={approvalLoading} onClick={() => setApprovalTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3" disabled={approvalLoading}>
                    {approvalLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Equipment ──────────────────────────────────────────── */}
      {showAddEquip && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fs-6 fw-bold text-dark mb-0">Add New Equipment</h5>
                <button type="button" className="btn-close" disabled={addEquipLoading} onClick={() => setShowAddEquip(false)} />
              </div>
              <form onSubmit={submitCreateEquipment}>
                <div className="modal-body p-4">
                  {/* Type Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Asset Classification</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className={`btn btn-sm flex-grow-1 ${newEquipType === 'serialized' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setNewEquipType('serialized')}
                      >
                        Serialized (High-Value)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm flex-grow-1 ${newEquipType === 'counted' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setNewEquipType('counted')}
                      >
                        Counted Inventory Pool
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Equipment Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Leica TS07 or Heavy-duty Tripods"
                      value={newEquipName}
                      onChange={(e) => setNewEquipName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Category *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Total Station, GPS, Drone, Tripod"
                      value={newEquipCategory}
                      onChange={(e) => setNewEquipCategory(e.target.value)}
                      required
                    />
                  </div>

                  {newEquipType === 'serialized' ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark mb-1">Serial Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Unique serial number"
                          value={newEquipSn}
                          onChange={(e) => setNewEquipSn(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="newEquipApprovalSwitch"
                          checked={newEquipReqApprove}
                          onChange={(e) => setNewEquipReqApprove(e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold text-dark" htmlFor="newEquipApprovalSwitch">
                          Require Operator Approval
                        </label>
                      </div>

                      {newEquipReqApprove && (
                        <div className="mb-2">
                          <label className="form-label small fw-semibold text-dark mb-1">Assigned Approver</label>
                          <select
                            className="form-select"
                            value={newEquipApproverId}
                            onChange={(e) => setNewEquipApproverId(e.target.value ? Number(e.target.value) : '')}
                            required
                          >
                            <option value="">Select approver...</option>
                            {personnel.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">Initial Total Quantity *</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        value={newEquipQty}
                        onChange={(e) => setNewEquipQty(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={addEquipLoading} onClick={() => setShowAddEquip(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3" disabled={addEquipLoading}>
                    {addEquipLoading ? 'Adding...' : 'Add Equipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add / Edit Person ──────────────────────────────────────── */}
      {personModalMode && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fs-6 fw-bold text-dark mb-0">
                  {personModalMode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}
                </h5>
                <button type="button" className="btn-close" disabled={personLoading} onClick={() => setPersonModalMode(null)} />
              </div>
              <form onSubmit={submitPerson}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ali Ahmed"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Role *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Field Surveyor, Office Admin, Drone Pilot"
                      value={personRole}
                      onChange={(e) => setPersonRole(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Phone Number (Pakistani Mobile) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+92 300 1234567"
                      value={personPhone}
                      onChange={(e) => setPersonPhone(e.target.value)}
                      required
                    />
                    <div className="form-text small text-muted">Used for WhatsApp reminders. Format: +92 3XX XXXXXXX or 03XXXXXXXXX</div>
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light bg-opacity-50">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={personLoading} onClick={() => setPersonModalMode(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3" disabled={personLoading}>
                    {personLoading ? 'Saving...' : personModalMode === 'add' ? 'Add Person' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
