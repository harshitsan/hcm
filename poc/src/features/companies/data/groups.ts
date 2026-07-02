/**
 * Group-company structures and shared-services (portfolio) assignments
 * (FR 6.2.4, CMP-10/11/17).
 */

export interface CompanyGroup {
  id: string
  name: string
  /** Company acting as the group parent. */
  parentCompanyId: string
}

/** Effective-dated parent–subsidiary relationship (CMP-17). */
export interface GroupMembership {
  id: string
  groupId: string
  companyId: string
  relationship: 'Parent' | 'Subsidiary'
  effectiveDate: string
  endDate: string | null
}

export interface Portfolio {
  id: string
  providerName: string
  adminEmail: string
}

export interface PortfolioAssignment {
  id: string
  portfolioId: string
  companyId: string
  assignedOn: string
  active: boolean
}

export const seedGroups: CompanyGroup[] = [
  {
    id: 'grp-01',
    name: 'Meridian Group',
    parentCompanyId: 'c-01',
  },
]

export const seedMemberships: GroupMembership[] = [
  {
    id: 'gm-01',
    groupId: 'grp-01',
    companyId: 'c-01',
    relationship: 'Parent',
    effectiveDate: '2023-01-15',
    endDate: null,
  },
  {
    id: 'gm-02',
    groupId: 'grp-01',
    companyId: 'c-02',
    relationship: 'Subsidiary',
    effectiveDate: '2023-02-01',
    endDate: null,
  },
  {
    id: 'gm-03',
    groupId: 'grp-01',
    companyId: 'c-07',
    relationship: 'Subsidiary',
    effectiveDate: '2025-01-05',
    endDate: null,
  },
]

export const seedPortfolios: Portfolio[] = [
  {
    id: 'pf-01',
    providerName: 'Astra Shared Services',
    adminEmail: 'omar.portfolio@astrashared.com',
  },
  {
    id: 'pf-02',
    providerName: 'Helios BPO Partners',
    adminEmail: 'ops@heliosbpo.com',
  },
]

export const seedAssignments: PortfolioAssignment[] = [
  {
    id: 'pa-01',
    portfolioId: 'pf-01',
    companyId: 'c-04',
    assignedOn: '2024-02-20',
    active: true,
  },
  {
    id: 'pa-02',
    portfolioId: 'pf-01',
    companyId: 'c-05',
    assignedOn: '2024-05-02',
    active: true,
  },
  {
    id: 'pa-03',
    portfolioId: 'pf-02',
    companyId: 'c-08',
    assignedOn: '2025-03-12',
    active: true,
  },
]
