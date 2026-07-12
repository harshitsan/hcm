/**
 * Read-only cross-references from the jurisdiction catalog to other modules
 * (O1): office locations and employee directory records that sit inside a
 * jurisdiction. A company can run multiple offices at different locations
 * within one jurisdiction; every employee belongs to exactly one.
 *
 * Other modules keep their own region identifiers today, so the alias map
 * below bridges catalog ids to the locations module's region ids. The ideal
 * long-term change is for those modules to reference catalog ids directly.
 */
import {
  seedEmployees as directoryEmployees,
  companyName as directoryCompanyName,
  type Employee as DirectoryEmployee,
} from '@/features/employees/data/employees'
import {
  seedLocations,
  type CompanyLocation,
} from '@/features/locations/data/locations'

/**
 * Catalog jurisdiction id → region ids used by the locations module.
 * Country-level entries cover the state regions inside them.
 */
const LOCATION_REGION_ALIASES: Record<string, string[]> = {
  'jur-01': ['jur-ka', 'jur-mh', 'jur-dl'],
  'jur-02': ['jur-tx', 'jur-ny'],
  'jur-03': ['jur-uk'],
  'jur-08': ['jur-ka'],
  'jur-09': ['jur-mh'],
}

/** Office sites operating inside a jurisdiction — many offices, one region. */
export function officesInJurisdiction(
  jurisdictionId: string
): CompanyLocation[] {
  const regionIds = LOCATION_REGION_ALIASES[jurisdictionId] ?? []
  return seedLocations.filter(
    (loc) => regionIds.includes(loc.jurisdictionId) && loc.status === 'active'
  )
}

/** Directory employees whose single jurisdiction is this catalog entry. */
export function employeesInJurisdiction(
  jurisdictionId: string
): DirectoryEmployee[] {
  return directoryEmployees.filter(
    (e) => e.jurisdictionId === jurisdictionId && e.lifecycleStage !== 'Exited'
  )
}

/** Company name for a directory employee record. */
export function directoryCompanyLabel(employee: DirectoryEmployee): string {
  return directoryCompanyName(employee.companyId)
}
