import { type Role } from '@/context/role-context'
import {
  COMPANIES,
  HOME_COMPANY_ID,
  HOME_GROUP,
  HOME_PORTFOLIO,
  type CompanyRef,
} from '../data/catalog'

/**
 * Tenant scope per role (DM-10 / DM-11 / DM-12 / DM-16):
 * - Platform Admin: every tenant on the platform
 * - Portfolio Admin: companies within their portfolio
 * - Group Company Admin: companies within their group
 * - Company Admin: their own company only
 * - Employees: no data-management scope
 */
export function allowedCompanies(role: Role): CompanyRef[] {
  switch (role) {
    case 'Platform Admin':
      return COMPANIES
    case 'Portfolio Admin':
      return COMPANIES.filter((c) => c.portfolio === HOME_PORTFOLIO)
    case 'Group Company Admin':
      return COMPANIES.filter((c) => c.group === HOME_GROUP)
    case 'Company Admin':
      return COMPANIES.filter((c) => c.id === HOME_COMPANY_ID)
    default:
      return []
  }
}

export function scopeLabel(role: Role): string {
  switch (role) {
    case 'Platform Admin':
      return 'All tenants on the platform'
    case 'Portfolio Admin':
      return `Companies in ${HOME_PORTFOLIO}`
    case 'Group Company Admin':
      return `Companies in ${HOME_GROUP}`
    case 'Company Admin':
      return 'Your company only'
    default:
      return 'No data-management access'
  }
}

export const ADMIN_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/** Demo submitter name per role, used for "Imported By" attribution. */
export function actorName(role: Role): string {
  switch (role) {
    case 'Platform Admin':
      return 'Platform Ops'
    case 'Portfolio Admin':
      return 'Nadia Kerr'
    case 'Group Company Admin':
      return 'Ravi Shastri'
    case 'Company Admin':
      return 'Dana Whitfield'
    default:
      return 'Employee'
  }
}
