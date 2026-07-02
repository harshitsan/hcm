import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  COMPANIES,
  CURRENT_COMPANY_ID,
  seedAudit,
  seedLocations,
  seedShares,
  type AuditEntry,
  type CompanyLocation,
  type LocationShare,
} from '../data/locations'
import { todayISO } from '../utils/format'

export type LocationDraft = Omit<CompanyLocation, 'id' | 'companyId' | 'createdOn'>

export type ShareStatus = 'active' | 'scheduled' | 'revoked'

let locationSeq = 1005

/**
 * In-memory locations store. Stands in for the real API while the backend is
 * disabled — locations are company-scoped by default and cross-company access
 * only exists through explicit, versioned share configuration (FR 6.5.2/6.5.4).
 */
export function useLocations() {
  const [locations, setLocations] = useState<CompanyLocation[]>(seedLocations)
  const [shares, setShares] = useState<LocationShare[]>(seedShares)
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit)

  /* ---------------- lookups ---------------- */

  const locationById = useMemo(() => {
    const map = new Map<string, CompanyLocation>()
    locations.forEach((l) => map.set(l.id, l))
    return map
  }, [locations])

  const companyById = useMemo(() => {
    const map = new Map(COMPANIES.map((c) => [c.id, c]))
    return map
  }, [])

  const companyName = useCallback(
    (id: string) => companyById.get(id)?.name ?? id,
    [companyById]
  )

  /** Effective status derived from the versioned config (LOC-13). */
  const shareStatus = useCallback((share: LocationShare): ShareStatus => {
    if (share.revoked) return 'revoked'
    return share.effectiveFrom > todayISO() ? 'scheduled' : 'active'
  }, [])

  /** Companies that may currently reference a location (owner excluded). */
  const activeTargetsOf = useCallback(
    (locationId: string): string[] =>
      shares
        .filter((s) => s.locationId === locationId && shareStatus(s) === 'active')
        .flatMap((s) => s.targetCompanyIds),
    [shares, shareStatus]
  )

  /**
   * Data-layer visibility rule (LOC-11): a company sees its owned locations
   * plus locations explicitly shared to it via an active group share.
   */
  const visibleTo = useCallback(
    (companyId: string): CompanyLocation[] =>
      locations.filter(
        (l) =>
          l.companyId === companyId ||
          activeTargetsOf(l.id).includes(companyId)
      ),
    [locations, activeTargetsOf]
  )

  const logAudit = useCallback(
    (action: string, locationId: string, detail: string, actor: string) => {
      const entry: AuditEntry = {
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        actor,
        action,
        locationId,
        detail,
      }
      setAudit((prev) => [entry, ...prev])
    },
    []
  )

  /* ---------------- location CRUD ---------------- */

  const addLocation = useCallback((draft: LocationDraft) => {
    locationSeq += 1
    const location: CompanyLocation = {
      ...draft,
      id: `LOC-${locationSeq}`,
      // Company-specific by default (LOC-02): owned by the creating company.
      companyId: CURRENT_COMPANY_ID,
      createdOn: todayISO(),
    }
    setLocations((prev) => [location, ...prev])
    toast.success(`${draft.name} created — scoped to your company by default`)
    return location
  }, [])

  const updateLocation = useCallback(
    (id: string, draft: LocationDraft) => {
      const existing = locationById.get(id)
      // Ownership-level changes stay with the owning company (LOC-08).
      if (existing && existing.companyId !== CURRENT_COMPANY_ID) {
        toast.error(
          'This location is referenced, not owned. Only the owning company can edit it.'
        )
        return false
      }
      setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...draft } : l)))
      toast.success(`${draft.name} updated`)
      return true
    },
    [locationById]
  )

  const deleteLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id))
    setShares((prev) => prev.filter((s) => s.locationId !== id))
  }, [])

  /* ---------------- sharing (explicit, versioned) ---------------- */

  const isSameGroup = useCallback(
    (companyA: string, companyB: string) => {
      const a = companyById.get(companyA)
      const b = companyById.get(companyB)
      return Boolean(a?.groupId && a.groupId === b?.groupId)
    },
    [companyById]
  )

  const enableShare = useCallback(
    (locationId: string, targetCompanyIds: string[], effectiveFrom: string, actor: string) => {
      const location = locationById.get(locationId)
      if (!location) return
      // Platform guardrail (LOC-07): only within the group-company structure.
      const outside = targetCompanyIds.filter((t) => !isSameGroup(location.companyId, t))
      if (outside.length > 0) {
        toast.error('Sharing blocked: target company is outside the group-company structure')
        return
      }
      const targets = targetCompanyIds.map(companyName).join(', ')
      setShares((prev) => {
        const existing = prev.find((s) => s.locationId === locationId)
        if (existing) {
          const version = existing.version + 1
          return prev.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  targetCompanyIds,
                  revoked: false,
                  effectiveFrom,
                  version,
                  history: [
                    ...s.history,
                    {
                      version,
                      action: 'updated' as const,
                      effectiveFrom,
                      targetCompanyIds,
                      changedBy: actor,
                      changedOn: todayISO(),
                      summary: `Sharing updated — now visible to ${targets}.`,
                    },
                  ],
                }
              : s
          )
        }
        const share: LocationShare = {
          id: `SHR-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
          locationId,
          targetCompanyIds,
          revoked: false,
          effectiveFrom,
          version: 1,
          history: [
            {
              version: 1,
              action: 'enabled',
              effectiveFrom,
              targetCompanyIds,
              changedBy: actor,
              changedOn: todayISO(),
              summary: `Sharing enabled for ${targets}.`,
            },
          ],
        }
        return [share, ...prev]
      })
      const scheduled = effectiveFrom > todayISO()
      logAudit(
        scheduled ? 'Sharing scheduled' : 'Sharing configured',
        locationId,
        `${location.name} shared with ${targets}, effective ${effectiveFrom}.`,
        actor
      )
      toast.success(
        scheduled
          ? `Sharing scheduled — takes effect ${effectiveFrom}`
          : `${location.name} is now shared with ${targets}`
      )
    },
    [locationById, isSameGroup, companyName, logAudit]
  )

  const revokeShare = useCallback(
    (shareId: string, actor: string) => {
      const share = shares.find((s) => s.id === shareId)
      if (!share) return
      const location = locationById.get(share.locationId)
      const version = share.version + 1
      setShares((prev) =>
        prev.map((s) =>
          s.id === shareId
            ? {
                ...s,
                revoked: true,
                version,
                history: [
                  ...s.history,
                  {
                    version,
                    action: 'revoked' as const,
                    effectiveFrom: todayISO(),
                    targetCompanyIds: [],
                    changedBy: actor,
                    changedOn: todayISO(),
                    summary: 'Sharing revoked — referencing companies lose access.',
                  },
                ],
              }
            : s
        )
      )
      logAudit(
        'Sharing revoked',
        share.locationId,
        `${location?.name ?? share.locationId} is no longer referenceable by other group companies.`,
        actor
      )
      toast.success('Sharing revoked — references are no longer available')
    },
    [shares, locationById, logAudit]
  )

  const refreshList = useCallback(() => {
    // No backend: state is already current; mirrors the grid Refresh action.
    setLocations((prev) => [...prev])
    toast.info(`List refreshed — ${locations.length} locations loaded`)
  }, [locations.length])

  return {
    locations,
    shares,
    audit,
    locationById,
    companyName,
    shareStatus,
    activeTargetsOf,
    visibleTo,
    isSameGroup,
    addLocation,
    updateLocation,
    deleteLocation,
    enableShare,
    revokeShare,
    refreshList,
  }
}

export type LocationsStore = ReturnType<typeof useLocations>
