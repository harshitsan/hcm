/**
 * Subscription packages as governed, versioned, effective-dated configuration
 * (FR 6.2.5, CMP-07/12/18/19/20).
 */
import { MODULES, type ModuleName } from './companies'

export interface PackageVersion {
  version: number
  effectiveDate: string
  companyLimit: number
  employeeLimit: number
  modules: ModuleName[]
  pricePerEmployeeMonth: number
  status: 'current' | 'superseded'
  changedBy: string
}

export interface SubscriptionPackage {
  id: string
  name: string
  tier: 'Basic' | 'Standard' | 'Enterprise'
  versions: PackageVersion[]
}

export const seedPackages: SubscriptionPackage[] = [
  {
    id: 'pkg-basic',
    name: 'Basic',
    tier: 'Basic',
    versions: [
      {
        version: 2,
        effectiveDate: '2025-04-01',
        companyLimit: 1,
        employeeLimit: 100,
        modules: ['Core HR', 'Leave', 'Time & Attendance'],
        pricePerEmployeeMonth: 2,
        status: 'current',
        changedBy: 'priya.platform@satellitehr.com',
      },
      {
        version: 1,
        effectiveDate: '2024-01-01',
        companyLimit: 1,
        employeeLimit: 50,
        modules: ['Core HR', 'Leave'],
        pricePerEmployeeMonth: 2,
        status: 'superseded',
        changedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
  {
    id: 'pkg-std',
    name: 'Standard',
    tier: 'Standard',
    versions: [
      {
        version: 3,
        effectiveDate: '2026-01-01',
        companyLimit: 3,
        employeeLimit: 500,
        modules: [
          'Core HR',
          'Payroll',
          'Time & Attendance',
          'Leave',
          'Recruitment',
          'Benefits',
        ],
        pricePerEmployeeMonth: 5,
        status: 'current',
        changedBy: 'priya.platform@satellitehr.com',
      },
      {
        version: 2,
        effectiveDate: '2025-01-01',
        companyLimit: 2,
        employeeLimit: 400,
        modules: ['Core HR', 'Payroll', 'Time & Attendance', 'Leave'],
        pricePerEmployeeMonth: 5,
        status: 'superseded',
        changedBy: 'priya.platform@satellitehr.com',
      },
      {
        version: 1,
        effectiveDate: '2024-01-01',
        companyLimit: 2,
        employeeLimit: 250,
        modules: ['Core HR', 'Payroll', 'Leave'],
        pricePerEmployeeMonth: 4,
        status: 'superseded',
        changedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
  {
    id: 'pkg-ent',
    name: 'Enterprise',
    tier: 'Enterprise',
    versions: [
      {
        version: 2,
        effectiveDate: '2025-07-01',
        companyLimit: 10,
        employeeLimit: 5000,
        modules: [...MODULES],
        pricePerEmployeeMonth: 9,
        status: 'current',
        changedBy: 'priya.platform@satellitehr.com',
      },
      {
        version: 1,
        effectiveDate: '2024-01-01',
        companyLimit: 5,
        employeeLimit: 2500,
        modules: [...MODULES],
        pricePerEmployeeMonth: 8,
        status: 'superseded',
        changedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
]

export function currentVersion(pkg: SubscriptionPackage): PackageVersion {
  return pkg.versions.find((v) => v.status === 'current') ?? pkg.versions[0]
}

export type EntitlementAction =
  | 'create-company'
  | 'add-employee'
  | 'access-module'

export interface EntitlementDecision {
  decision: 'ALLOW' | 'DENY' | 'FLAG'
  rule: string
  reason: string
}
