/**
 * Portfolio audit trail (PORT-FR-010, PORT-25/26). Every portfolio-level
 * operation records the user, companies affected, action type & parameters,
 * timestamp and success/failure status. Entries are retained 7 years (§8.2).
 */
export const PORTFOLIO_EVENT_TYPES = [
  'PORTFOLIO_CREATED',
  'PORTFOLIO_MODIFIED',
  'CONTEXT_SWITCHED',
  'BULK_IMPORT',
  'POLICY_DEPLOYED',
  'ANNOUNCEMENT_PUBLISHED',
  'REPORT_EXPORTED',
  'EMPLOYEE_SEARCH',
] as const

export type PortfolioEventType = (typeof PORTFOLIO_EVENT_TYPES)[number]

export interface PortfolioAuditEvent {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  eventType: PortfolioEventType
  /** Company names affected by the operation. */
  companiesAffected: string[]
  /** Action parameters / change summary. */
  parameters: string
  status: 'success' | 'failure'
}

export const seedAuditEvents: PortfolioAuditEvent[] = [
  {
    id: 'aud-101',
    timestamp: '2026-06-10 11:42',
    actor: 'priya.platform@satellitehr.com',
    actorRole: 'Platform Admin',
    eventType: 'PORTFOLIO_MODIFIED',
    companiesAffected: ['Atlas Freight'],
    parameters: 'Industrial Holdings — status changed Active → Inactive',
    status: 'success',
  },
  {
    id: 'aud-102',
    timestamp: '2026-06-08 09:15',
    actor: 'omar.haddad@satellitehr.com',
    actorRole: 'Portfolio Admin',
    eventType: 'CONTEXT_SWITCHED',
    companiesAffected: ['Meridian Technologies', 'Zephyr Retail'],
    parameters: 'from=Meridian Technologies, to=Zephyr Retail',
    status: 'success',
  },
  {
    id: 'aud-103',
    timestamp: '2026-06-05 16:03',
    actor: 'grace.kim@meridiantech.in',
    actorRole: 'Group Company Admin',
    eventType: 'CONTEXT_SWITCHED',
    companiesAffected: ['Quanta Finance'],
    parameters:
      'AUTH_002 — context switch to Quanta Finance not permitted (403)',
    status: 'failure',
  },
  {
    id: 'aud-104',
    timestamp: '2026-05-28 14:27',
    actor: 'omar.haddad@satellitehr.com',
    actorRole: 'Portfolio Admin',
    eventType: 'BULK_IMPORT',
    companiesAffected: ['Northline Logistics'],
    parameters: 'employee_import_may.xlsx — 118 rows processed, 0 errors',
    status: 'success',
  },
  {
    id: 'aud-105',
    timestamp: '2026-05-20 10:12',
    actor: 'priya.platform@satellitehr.com',
    actorRole: 'Platform Admin',
    eventType: 'PORTFOLIO_MODIFIED',
    companiesAffected: [
      'Meridian Technologies',
      'Northline Logistics',
      'Zephyr Retail',
    ],
    parameters: 'Shared Services North — description updated',
    status: 'success',
  },
  {
    id: 'aud-106',
    timestamp: '2026-05-14 12:55',
    actor: 'omar.haddad@satellitehr.com',
    actorRole: 'Portfolio Admin',
    eventType: 'POLICY_DEPLOYED',
    companiesAffected: ['Meridian Technologies', 'Northline Logistics'],
    parameters: 'Leave & Holiday Policy v3.2 — 2/2 companies succeeded',
    status: 'success',
  },
  {
    id: 'aud-107',
    timestamp: '2026-04-30 08:41',
    actor: 'omar.haddad@satellitehr.com',
    actorRole: 'Portfolio Admin',
    eventType: 'ANNOUNCEMENT_PUBLISHED',
    companiesAffected: [
      'Meridian Technologies',
      'Northline Logistics',
      'Zephyr Retail',
    ],
    parameters:
      '"Payroll cut-off moves to the 24th" — portfolio-wide broadcast',
    status: 'success',
  },
  {
    id: 'aud-108',
    timestamp: '2026-04-18 17:20',
    actor: 'leena.pillai@satellitehr.com',
    actorRole: 'Portfolio Admin',
    eventType: 'REPORT_EXPORTED',
    companiesAffected: ['Cascade Analytics', 'Helix BioWorks'],
    parameters: 'Consolidated headcount report — Excel export',
    status: 'success',
  },
  {
    id: 'aud-109',
    timestamp: '2026-02-25 09:00',
    actor: 'priya.platform@satellitehr.com',
    actorRole: 'Platform Admin',
    eventType: 'PORTFOLIO_CREATED',
    companiesAffected: ['Atlas Freight'],
    parameters:
      'PORT-2026-002 Industrial Holdings — manager Sofia Mendes, 1 company',
    status: 'success',
  },
  {
    id: 'aud-110',
    timestamp: '2026-01-12 09:30',
    actor: 'priya.platform@satellitehr.com',
    actorRole: 'Platform Admin',
    eventType: 'PORTFOLIO_CREATED',
    companiesAffected: ['Quanta Finance', 'Sundale Hospitality'],
    parameters:
      'PORT-2026-001 Finance & Hospitality — manager Daniel Osei, 2 companies',
    status: 'success',
  },
]
