import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedCompanies } from '../data/group-companies'
import { seedLocations, type SharedLocation } from '../data/sharing'
import { type RecordAudit } from './use-audit'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Shared-location store (GRP-03, GRP-24). Enforces the owner/referencing
 * permission matrix: only the owner creates/edits/approves; referencing
 * companies request, remove, and assign employees — everything audited.
 */
export function useSharedLocations(record: RecordAudit) {
  const [locations, setLocations] = useState<SharedLocation[]>(seedLocations)

  const name = useCallback(
    (companyId: string) =>
      seedCompanies.find((c) => c.id === companyId)?.name ?? companyId,
    []
  )

  const toggleShare = useCallback(
    (locationId: string, groupCode: string) => {
      const loc = locations.find((l) => l.id === locationId)
      if (!loc) return
      setLocations((prev) =>
        prev.map((l) => (l.id === locationId ? { ...l, shared: !l.shared } : l))
      )
      record({
        action: loc.shared ? 'LOCATION_UNSHARED' : 'LOCATION_SHARED',
        category: 'location',
        groupCode,
        targetCompany: name(loc.ownerCompanyId),
        detail: `${loc.name} ${loc.shared ? 'withdrawn from' : 'exposed to'} the group by its owner`,
      })
      toast.success(
        loc.shared
          ? `${loc.name} is no longer shared with the group`
          : `${loc.name} shared with the group — references need owner approval`
      )
    },
    [locations, name, record]
  )

  const requestReference = useCallback(
    (locationId: string, companyId: string, groupCode: string) => {
      const loc = locations.find((l) => l.id === locationId)
      if (!loc) return
      if (!loc.shared) {
        toast.error('Denied — the owner has not shared this location with the group')
        return
      }
      if (loc.references.some((r) => r.companyId === companyId && (r.status === 'Approved' || r.status === 'Pending'))) {
        toast.error(`${name(companyId)} already has a reference to ${loc.name}`)
        return
      }
      setLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? {
                ...l,
                references: [
                  ...l.references,
                  {
                    id: `lr-${crypto.randomUUID().slice(0, 6)}`,
                    companyId,
                    status: 'Pending',
                    requestedOn: today(),
                    decidedOn: null,
                    assignedEmployees: 0,
                  },
                ],
              }
            : l
        )
      )
      record({
        action: 'LOCATION_REFERENCE_REQUESTED',
        category: 'location',
        groupCode,
        targetCompany: name(loc.ownerCompanyId),
        detail: `${name(companyId)} requested a reference to ${loc.name} — pending owner approval`,
      })
      toast.success(`Reference requested — awaiting approval from ${name(loc.ownerCompanyId)}`)
    },
    [locations, name, record]
  )

  const decideReference = useCallback(
    (locationId: string, refId: string, approve: boolean, groupCode: string) => {
      const loc = locations.find((l) => l.id === locationId)
      const ref = loc?.references.find((r) => r.id === refId)
      if (!loc || !ref) return
      setLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? {
                ...l,
                references: l.references.map((r) =>
                  r.id === refId
                    ? { ...r, status: approve ? 'Approved' : 'Denied', decidedOn: today() }
                    : r
                ),
              }
            : l
        )
      )
      record({
        action: approve ? 'LOCATION_REFERENCE_APPROVED' : 'LOCATION_REFERENCE_DENIED',
        category: 'location',
        groupCode,
        targetCompany: name(ref.companyId),
        detail: `Owner ${approve ? 'approved' : 'denied'} ${name(ref.companyId)} reference to ${loc.name}`,
      })
      toast.success(approve ? 'Reference approved — view access limited to address & contact' : 'Reference denied')
    },
    [locations, name, record]
  )

  const removeReference = useCallback(
    (locationId: string, refId: string, groupCode: string) => {
      const loc = locations.find((l) => l.id === locationId)
      const ref = loc?.references.find((r) => r.id === refId)
      if (!loc || !ref) return
      setLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? {
                ...l,
                references: l.references.map((r) =>
                  r.id === refId ? { ...r, status: 'Removed', decidedOn: today() } : r
                ),
              }
            : l
        )
      )
      record({
        action: 'LOCATION_REFERENCE_REMOVED',
        category: 'location',
        groupCode,
        targetCompany: name(ref.companyId),
        detail: `${name(ref.companyId)} removed its reference to ${loc.name} — the owner's location is unaffected`,
      })
      toast.success('Reference removed — recorded in the audit trail')
    },
    [locations, name, record]
  )

  /** Both owner and referencing company may assign employees (matrix row 4). */
  const assignEmployee = useCallback(
    (locationId: string, refId: string | null, companyId: string, groupCode: string) => {
      const loc = locations.find((l) => l.id === locationId)
      if (!loc) return
      if (refId) {
        setLocations((prev) =>
          prev.map((l) =>
            l.id === locationId
              ? {
                  ...l,
                  references: l.references.map((r) =>
                    r.id === refId ? { ...r, assignedEmployees: r.assignedEmployees + 1 } : r
                  ),
                }
              : l
          )
        )
      }
      record({
        action: 'LOCATION_USED_IN_ASSIGNMENT',
        category: 'location',
        groupCode,
        targetCompany: name(companyId),
        detail: `${name(companyId)} assigned an employee to ${loc.name}`,
      })
      toast.success(`Employee assigned to ${loc.name}`)
    },
    [locations, name, record]
  )

  return {
    locations,
    toggleShare,
    requestReference,
    decideReference,
    removeReference,
    assignEmployee,
  }
}

export type SharedLocationsStore = ReturnType<typeof useSharedLocations>
