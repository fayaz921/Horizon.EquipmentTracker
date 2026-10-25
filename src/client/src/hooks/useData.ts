import { useState, useEffect, useCallback } from 'react'
import type { ActiveCustodyLineDto, EquipmentAvailabilityDto, PersonnelDto, SurveyKitDto } from '../types'
import {
  fetchActiveCustody,
  fetchEquipment,
  fetchPersonnel,
  fetchKits,
} from '../api/apiClient'

// ─── useBoardData ─────────────────────────────────────────────────────────────

interface BoardData {
  custodyLines: ActiveCustodyLineDto[]
  equipment: EquipmentAvailabilityDto | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useBoardData(): BoardData {
  const [custodyLines, setCustodyLines] = useState<ActiveCustodyLineDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentAvailabilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [lines, equip] = await Promise.all([fetchActiveCustody(), fetchEquipment()])
      setCustodyLines(lines)
      setEquipment(equip)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load board data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { custodyLines, equipment, loading, error, refresh: load }
}

// ─── usePersonnel ─────────────────────────────────────────────────────────────

interface PersonnelData {
  personnel: PersonnelDto[]
  loading: boolean
  error: string | null
}

export function usePersonnel(): PersonnelData {
  const [personnel, setPersonnel] = useState<PersonnelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchPersonnel()
      .then(setPersonnel)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load personnel.'))
      .finally(() => setLoading(false))
  }, [])

  return { personnel, loading, error }
}

// ─── useEquipmentAndKits ──────────────────────────────────────────────────────

interface EquipmentAndKits {
  equipment: EquipmentAvailabilityDto | null
  kits: SurveyKitDto[]
  loading: boolean
  error: string | null
}

export function useEquipmentAndKits(): EquipmentAndKits {
  const [equipment, setEquipment] = useState<EquipmentAvailabilityDto | null>(null)
  const [kits, setKits] = useState<SurveyKitDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchEquipment(), fetchKits()])
      .then(([equip, kitList]) => {
        setEquipment(equip)
        setKits(kitList)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load equipment.'))
      .finally(() => setLoading(false))
  }, [])

  return { equipment, kits, loading, error }
}
