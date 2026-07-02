import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCompanyDetails,
  seedDepartments,
  seedOrgLocations,
  seedOrgPolicies,
  seedPositions,
  type CompanyDetails,
  type Department,
  type OrgLocation,
  type OrgPolicy,
  type PolicyDimension,
  type Position,
} from '../data/org-model'

/**
 * In-memory organization model store (SYS-06, 22, 45, 46, 47, 48, 49, 50,
 * 51). Company details, n-level departments, positions, locations and
 * policy applicability for the active company (ASTER-IN).
 */
export function useOrgModel() {
  const [company, setCompany] = useState<CompanyDetails>(seedCompanyDetails)
  const [departments, setDepartments] =
    useState<Department[]>(seedDepartments)
  const [positions, setPositions] = useState<Position[]>(seedPositions)
  const [locations, setLocations] = useState<OrgLocation[]>(seedOrgLocations)
  const [policies, setPolicies] = useState<OrgPolicy[]>(seedOrgPolicies)

  const updateCompany = useCallback((next: CompanyDetails) => {
    setCompany(next)
    toast.success('Company details saved for the tenant')
  }, [])

  /** Adds a node anywhere in the n-level hierarchy (SYS-50). */
  const addDepartment = useCallback(
    (name: string, parentId: string | null) => {
      setDepartments((prev) => [
        ...prev,
        {
          id: `dep-${crypto.randomUUID().slice(0, 8)}`,
          name,
          parentId,
        },
      ])
      toast.success(
        parentId ? `${name} nested under its parent` : `${name} added as a root department`
      )
    },
    []
  )

  /** A position always belongs to exactly one department (SYS-46). */
  const addPosition = useCallback((title: string, departmentId: string) => {
    setPositions((prev) => [
      ...prev,
      {
        id: `pos-${crypto.randomUUID().slice(0, 8)}`,
        title,
        departmentId,
        holders: 0,
      },
    ])
    toast.success(`${title} created in its department`)
  }, [])

  /** Group sharing requires cross-company approval (SYS-49). */
  const requestLocationSharing = useCallback((id: string) => {
    const loc = locations.find((l) => l.id === id)
    toast.success(
      `Sharing request for ${loc?.name ?? 'location'} submitted — pending group approval`
    )
  }, [locations])

  const addLocation = useCallback((name: string, city: string) => {
    setLocations((prev) => [
      ...prev,
      {
        id: `loc-${crypto.randomUUID().slice(0, 8)}`,
        name,
        city,
        sharedWithGroup: false,
      },
    ])
    toast.success(`${name} added — company-specific by default`)
  }, [])

  /** One, several, or all applicability dimensions (SYS-51). */
  const updatePolicyDimensions = useCallback(
    (id: string, dimensions: PolicyDimension[]) => {
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, dimensions } : p))
      )
      toast.success(
        dimensions.length === 0
          ? 'Policy now applies to all dimensions'
          : `Policy applicability updated (${dimensions.length} dimension(s))`
      )
    },
    []
  )

  return {
    company,
    departments,
    positions,
    locations,
    policies,
    updateCompany,
    addDepartment,
    addPosition,
    requestLocationSharing,
    addLocation,
    updatePolicyDimensions,
  }
}

export type OrgModelStore = ReturnType<typeof useOrgModel>
