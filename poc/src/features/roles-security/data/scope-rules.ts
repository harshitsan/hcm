/**
 * Security scope rules — governed, versioned configuration restricting data
 * access by company, group, department and workforce type (RSEC-03,
 * RSEC-19). All configured dimensions must be satisfied simultaneously for
 * a record to be visible; the same predicate is what row-level security
 * enforces at the persistence layer (RSEC-16).
 */
import type { Department, Person, WorkforceType } from './directory'

export interface ScopeRuleVersion {
  version: number
  updatedBy: string
  updatedOn: string
  note: string
}

export interface ScopeRule {
  id: string
  name: string
  /** Companies the rule exposes. Empty = every company in the author's authority. */
  companyIds: string[]
  /** Departments exposed. Empty = all departments. */
  departments: Department[]
  /** Workforce types exposed. Empty = all workforce types. */
  workforceTypes: WorkforceType[]
  version: number
  effectiveFrom: string
  status: 'Published' | 'Draft'
  updatedBy: string
  updatedOn: string
  /** Prior versions retained for audit (RSEC-19). */
  history: ScopeRuleVersion[]
}

/**
 * A record is exposed only when every configured dimension matches
 * (RSEC-03: "all dimensions must be satisfied simultaneously").
 */
export function ruleAllowsPerson(rule: ScopeRule, person: Person): boolean {
  const companyOk =
    rule.companyIds.length === 0 || rule.companyIds.includes(person.companyId)
  const deptOk =
    rule.departments.length === 0 ||
    rule.departments.includes(person.department)
  const wtOk =
    rule.workforceTypes.length === 0 ||
    rule.workforceTypes.includes(person.workforceType)
  return companyOk && deptOk && wtOk
}

export const seedScopeRules: ScopeRule[] = [
  {
    id: 'rule-01',
    name: 'Aurora — all employees',
    companyIds: ['co-1'],
    departments: [],
    workforceTypes: [],
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'Published',
    updatedBy: 'Sunita Patil',
    updatedOn: '2025-12-28',
    history: [],
  },
  {
    id: 'rule-02',
    name: 'Aurora — Engineering permanents only',
    companyIds: ['co-1'],
    departments: ['Engineering'],
    workforceTypes: ['Permanent'],
    version: 2,
    effectiveFrom: '2026-04-01',
    status: 'Published',
    updatedBy: 'Sunita Patil',
    updatedOn: '2026-03-25',
    history: [
      {
        version: 1,
        updatedBy: 'Sunita Patil',
        updatedOn: '2026-01-05',
        note: 'Initially covered all Engineering workforce types',
      },
    ],
  },
  {
    id: 'rule-03',
    name: 'Tech group — HR records',
    companyIds: ['co-1', 'co-2'],
    departments: ['HR'],
    workforceTypes: [],
    version: 1,
    effectiveFrom: '2026-02-01',
    status: 'Published',
    updatedBy: 'Arjun Mehta',
    updatedOn: '2026-01-25',
    history: [],
  },
  {
    id: 'rule-04',
    name: 'Contract & consultant workforce only',
    companyIds: [],
    departments: [],
    workforceTypes: ['Contract', 'Consultant'],
    version: 1,
    effectiveFrom: '2026-03-01',
    status: 'Published',
    updatedBy: 'Arjun Mehta',
    updatedOn: '2026-02-20',
    history: [],
  },
  {
    id: 'rule-05',
    name: 'Retail group — Operations',
    companyIds: ['co-3', 'co-4'],
    departments: ['Operations'],
    workforceTypes: [],
    version: 1,
    effectiveFrom: '2026-02-15',
    status: 'Published',
    updatedBy: 'Devika Rao',
    updatedOn: '2026-02-10',
    history: [],
  },
  {
    id: 'rule-06',
    name: 'Aurora — Finance interns (draft)',
    companyIds: ['co-1'],
    departments: ['Finance'],
    workforceTypes: ['Intern'],
    version: 1,
    effectiveFrom: '2026-08-01',
    status: 'Draft',
    updatedBy: 'Sunita Patil',
    updatedOn: '2026-06-20',
    history: [],
  },
]
