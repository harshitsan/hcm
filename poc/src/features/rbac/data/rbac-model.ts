/**
 * RBAC model — the comprehensive access map for SatelliteHR.
 *
 * Source of truth: `Refined_Comprehensive_Satellite_BRD.md` (§6 actors/roles,
 * §7 module universe D0–D9, §11 cross-module rules). Every in-scope module and
 * its sub-capabilities are enumerated here, with the access level each of the
 * 18 canonical roles holds — derived from the role capability table (§6),
 * the comp-dark rule (principle 6 / §247), tenant isolation, and the
 * workforce-type boundaries.
 *
 * Access is declared at the module level and inherited by each submodule
 * unless the submodule overrides it (used for comp-dark fields and
 * employee-facing self-service inside otherwise admin-owned modules).
 */

// ─── Roles (18, across 6 tiers) ──────────────────────────────────────────────

export type Tier =
  | 'Platform'
  | 'Portfolio'
  | 'Group'
  | 'Company'
  | 'Manager'
  | 'Workforce'

export type RoleId =
  | 'p-sa' | 'p-oa' | 'p-sc'
  | 'pf-m' | 'pf-hr' | 'pf-ro'
  | 'g-ca' | 'g-rv'
  | 'c-sa' | 'c-hr' | 'c-it' | 'c-fc'
  | 'm-dh' | 'm-fm'
  | 'w-es' | 'w-el' | 'w-ca' | 'w-pm'

export type RoleDef = {
  id: RoleId
  tier: Tier
  name: string
  short: string
  capability: string
}

export const ROLES: RoleDef[] = [
  { id: 'p-sa', tier: 'Platform', name: 'Platform Super Admin', short: 'PSA', capability: 'Provision/suspend companies, jurisdiction catalog, SSO, global config, platform health.' },
  { id: 'p-oa', tier: 'Platform', name: 'Platform Operations Admin', short: 'POA', capability: 'Onboarding support, config troubleshooting, supervised imports; no super-admin rights.' },
  { id: 'p-sc', tier: 'Platform', name: 'Platform Security & Compliance Admin', short: 'PSC', capability: 'Cross-tenant audit (metadata only), security & password policy; no transactional edits.' },
  { id: 'pf-m', tier: 'Portfolio', name: 'Portfolio Manager', short: 'PFM', capability: 'Multi-company admin, context switch without re-login, cross-company reports, standardisation.' },
  { id: 'pf-hr', tier: 'Portfolio', name: 'Portfolio HR Operations', short: 'PHR', capability: 'Lifecycle execution across companies; no structural ownership unless granted.' },
  { id: 'pf-ro', tier: 'Portfolio', name: 'Portfolio Read-Only / Auditor', short: 'PRO', capability: 'Read-only cross-portfolio reporting; policy alignment & compliance visibility.' },
  { id: 'g-ca', tier: 'Group', name: 'Group Company Admin', short: 'GCA', capability: 'Group relationships, shared locations, sharing approvals.' },
  { id: 'g-rv', tier: 'Group', name: 'Group Reporting Viewer', short: 'GRV', capability: 'Consolidated reports, cross-company directory; no edits.' },
  { id: 'c-sa', tier: 'Company', name: 'Company Super Admin', short: 'CSA', capability: 'Full tenant setup, roles, policy, users, reports (compensation stays HR/Finance-restricted).' },
  { id: 'c-hr', tier: 'Company', name: 'Company HR Admin', short: 'CHR', capability: 'Employees, policy, lifecycle, leave/attendance, compensation & payroll computation, HR reports.' },
  { id: 'c-it', tier: 'Company', name: 'Company IT/Security Admin', short: 'CIT', capability: 'User-role assignment, SSO, MFA, access audits.' },
  { id: 'c-fc', tier: 'Company', name: 'Finance / Compliance Viewer', short: 'CFC', capability: 'View employee/attendance/leave + comp/payroll outputs; compliance exports.' },
  { id: 'm-dh', tier: 'Manager', name: 'Dept Head / People Manager', short: 'DH', capability: 'Team views, approvals, lifecycle initiation, performance.' },
  { id: 'm-fm', tier: 'Manager', name: 'Functional / Project Manager', short: 'FM', capability: 'Matrix-scope views and approvals.' },
  { id: 'w-es', tier: 'Workforce', name: 'Employee — Standard', short: 'EMP', capability: 'Self-service profile, leave, attendance, announcements, feedback (no comp visibility).' },
  { id: 'w-el', tier: 'Workforce', name: 'Employee — Limited', short: 'LTD', capability: 'Read-only / restricted transactions per policy.' },
  { id: 'w-ca', tier: 'Workforce', name: 'Candidate', short: 'CND', capability: 'Pre-conversion recruitment interactions.' },
  { id: 'w-pm', tier: 'Workforce', name: 'Interview Panel Member', short: 'PNL', capability: 'Interview scheduling, scorecards, feedback.' },
]

export const TIERS: Tier[] = ['Platform', 'Portfolio', 'Group', 'Company', 'Manager', 'Workforce']

// ─── Access levels ───────────────────────────────────────────────────────────

export type Level = 'manage' | 'edit' | 'approve' | 'view' | 'self' | 'none'

export const LEVEL_META: Record<Level, { label: string; abbr: string; desc: string; rank: number }> = {
  manage: { label: 'Manage', abbr: 'M', desc: 'Full control — configure, create, edit, delete.', rank: 5 },
  edit: { label: 'Edit', abbr: 'E', desc: 'Create & update records / transactions.', rank: 4 },
  approve: { label: 'Approve', abbr: 'A', desc: 'Review & approve/reject in workflow.', rank: 3 },
  view: { label: 'View', abbr: 'V', desc: 'Read-only access.', rank: 2 },
  self: { label: 'Self', abbr: 'S', desc: 'Own records only (self-service).', rank: 1 },
  none: { label: 'No access', abbr: '—', desc: 'Not accessible for this role.', rank: 0 },
}

// Access spec = for each grantable level, the roles that hold it.
type AccessSpec = Partial<Record<Exclude<Level, 'none'>, RoleId[]>>

export type Submodule = {
  name: string
  note?: string
  compDark?: boolean
  restricted?: boolean
  access?: AccessSpec
}

export type Module = {
  code: string
  name: string
  purpose: string
  compDark?: boolean
  restricted?: boolean
  access: AccessSpec
  subs: Submodule[]
}

export type Domain = {
  code: string
  name: string
  blurb: string
  modules: Module[]
}

/** Effective level for a role given an access spec (highest-ranked match). */
export function levelFor(spec: AccessSpec, role: RoleId): Level {
  const order: Exclude<Level, 'none'>[] = ['manage', 'edit', 'approve', 'view', 'self']
  for (const lvl of order) if (spec[lvl]?.includes(role)) return lvl
  return 'none'
}

export function subAccess(mod: Module, sub: Submodule): AccessSpec {
  return sub.access ?? mod.access
}

// ─── Role groups (compact declaration helpers) ───────────────────────────────

const P = { SA: 'p-sa', OA: 'p-oa', SC: 'p-sc' } as const
const PF = { M: 'pf-m', HR: 'pf-hr', RO: 'pf-ro' } as const
const G = { CA: 'g-ca', RV: 'g-rv' } as const
const C = { SA: 'c-sa', HR: 'c-hr', IT: 'c-it', FC: 'c-fc' } as const
const M = { DH: 'm-dh', FM: 'm-fm' } as const
const W = { ES: 'w-es', EL: 'w-el', CA: 'w-ca', PM: 'w-pm' } as const

const EMPS: RoleId[] = [W.ES, W.EL]
const MGRS: RoleId[] = [M.DH, M.FM]

// ─── The module universe with access (D0–D9) ─────────────────────────────────

export const DOMAINS: Domain[] = [
  {
    code: 'D0',
    name: 'Platform Foundation',
    blurb: 'The multi-tenant spine plus the reusable engines. Built first; everything depends on it.',
    modules: [
      {
        code: 'F1',
        name: 'Identity & Access',
        purpose: 'Authenticate users; manage the distinct User identity, multi-company access, and in-session context switching.',
        access: { manage: [P.SA, C.IT], edit: [C.SA, P.OA], view: [P.SC, PF.M, PF.RO, G.CA], self: [...EMPS, ...MGRS, C.FC] },
        subs: [
          { name: 'Authentication providers (SAML/AD/O365/Google/email)', access: { manage: [P.SA, C.IT], edit: [C.SA], view: [P.SC, PF.M] } },
          { name: 'User accounts & workforce linkage', access: { manage: [C.IT, C.SA], edit: [C.HR, P.OA], view: [PF.M, PF.RO] } },
          { name: 'Multi-company access grants', access: { manage: [P.SA, C.IT], edit: [PF.M, C.SA], view: [P.SC, PF.RO] } },
          { name: 'In-session context switching', access: { self: [P.SA, P.OA, PF.M, PF.HR, PF.RO, G.CA, C.SA, C.HR, C.IT, C.FC, ...MGRS] } },
          { name: 'Password management', access: { manage: [C.IT], self: [...EMPS, ...MGRS, C.SA, C.HR, C.FC] } },
          { name: 'Authentication audit logs', access: { view: [P.SC, C.IT, C.SA, PF.RO] } },
          { name: 'MFA / session-timeout policy', access: { manage: [C.IT, P.SC], edit: [C.SA], view: [PF.RO] } },
        ],
      },
      {
        code: 'F2',
        name: 'Roles, Permissions & Security (RBAC)',
        purpose: 'Govern who can do what at every tier with composable permissions, delegation, and impersonation.',
        access: { manage: [P.SA, C.SA, C.IT], edit: [PF.M], view: [P.SC, PF.RO, G.CA] },
        subs: [
          { name: 'Roles (personas)', access: { manage: [P.SA, C.SA, C.IT], view: [P.SC, PF.RO] } },
          { name: 'Permission sets (composable capabilities)', access: { manage: [P.SA, C.SA, C.IT], view: [P.SC, PF.RO] } },
          { name: 'Scope filters (company/dept/group/location/type)', access: { manage: [C.SA, C.IT], edit: [PF.M], view: [PF.RO] } },
          { name: 'Delegation (with auto-expiry)', access: { manage: [C.SA, C.IT], self: [...MGRS, C.HR, W.ES], view: [PF.RO] } },
          { name: 'Impersonation ("login as", audited)', access: { manage: [P.SA], edit: [C.IT], view: [P.SC] } },
          { name: 'MFA configuration', access: { manage: [C.IT, P.SC], view: [C.SA] } },
          { name: '⭐ Compensation-visibility rule', restricted: true, access: { manage: [C.HR], view: [C.SA, C.FC, P.SC] } },
        ],
      },
      {
        code: 'F3',
        name: 'Multi-Company Operating Model',
        purpose: 'Implement Platform → Portfolio → Group Company → Company and the rules for cross-company operation.',
        access: { manage: [P.SA, PF.M], approve: [G.CA], view: [P.OA, PF.RO, G.RV, C.SA] },
        subs: [
          { name: 'Portfolio construct', access: { manage: [P.SA, PF.M], view: [PF.RO, C.SA] } },
          { name: 'Group-company construct', access: { manage: [P.SA, G.CA], approve: [G.CA], view: [G.RV, PF.RO] } },
          { name: 'Cross-company access enablement', access: { manage: [P.SA, PF.M], approve: [G.CA], view: [PF.RO] } },
          { name: 'Consolidated reporting rules', access: { manage: [P.SA], view: [PF.M, PF.RO, G.RV] } },
          { name: 'Row-level security & audit', access: { manage: [P.SA], view: [P.SC, PF.RO] } },
        ],
      },
      {
        code: 'F4',
        name: 'Company Management',
        purpose: 'Provision and run the lifecycle of tenant companies.',
        access: { manage: [P.SA, C.SA], edit: [P.OA, PF.M], view: [P.SC, PF.RO, G.CA, C.IT, C.FC] },
        subs: [
          { name: 'Company provisioning', access: { manage: [P.SA], edit: [P.OA, PF.M], view: [PF.RO] } },
          { name: 'Business / legal details', access: { manage: [C.SA, P.SA], edit: [PF.M], view: [C.IT, C.FC, PF.RO] } },
          { name: 'Jurisdiction operation mapping', access: { manage: [P.SA, C.SA], view: [PF.RO, C.FC] } },
          { name: 'Subscription & commercial packaging', access: { manage: [P.SA], view: [PF.M, C.SA, C.FC] } },
          { name: 'Lifecycle & archival (provision→suspend→archive)', access: { manage: [P.SA], view: [P.SC, C.SA, PF.RO] } },
          { name: 'Full data export on exit', access: { manage: [P.SA, C.SA], view: [PF.RO] } },
        ],
      },
      {
        code: 'F5',
        name: 'Audit & Activity Log',
        purpose: 'Immutable, tamper-resistant record of who changed what.',
        access: { manage: [C.SA], view: [P.SA, P.SC, C.IT, C.FC, PF.RO, G.CA] },
        subs: [
          { name: 'Audited-entity configuration', access: { manage: [C.SA], view: [P.SC, C.IT] } },
          { name: 'Record change-history viewer', access: { view: [P.SA, P.SC, C.SA, C.HR, C.IT, C.FC, PF.RO] } },
          { name: 'Tamper-resistance & role restriction', access: { manage: [C.SA], view: [P.SC] } },
          { name: 'Retention (1yr active + 6 archived)', access: { manage: [P.SA, C.SA], view: [P.SC, PF.RO] } },
        ],
      },
      {
        code: 'F6',
        name: 'Workflow & Approval Engine',
        purpose: 'One reusable approval engine every module declares into — never re-implemented.',
        access: { manage: [C.SA, C.HR], edit: [PF.M], view: [C.IT, PF.RO] },
        subs: [
          { name: 'Workflow configuration (conditional routing)', access: { manage: [C.SA, C.HR], edit: [PF.M], view: [PF.RO] } },
          { name: 'Approval patterns (sequential/parallel/mixed)', access: { manage: [C.SA, C.HR], view: [PF.RO] } },
          { name: 'SLA management (calendars, reminders 50/75%)', access: { manage: [C.SA, C.HR], view: [C.FC, PF.RO] } },
          { name: 'Escalation strategies', access: { manage: [C.SA, C.HR], view: [PF.RO] } },
          { name: 'Approval / routing audit', access: { view: [C.SA, C.IT, C.FC, P.SC, PF.RO] } },
        ],
      },
      {
        code: 'F7',
        name: 'Notifications, Alerts & Communications',
        purpose: 'Deliver event- and schedule-driven messages; emit push events for mobile.',
        access: { manage: [C.SA, C.HR], edit: [PF.HR], self: [...EMPS, ...MGRS], view: [C.FC] },
        subs: [
          { name: 'Channels (email/in-app/Teams/WhatsApp)', access: { manage: [C.SA, C.HR], view: [PF.RO] } },
          { name: 'Delivery models (event & scheduler)', access: { manage: [C.HR], edit: [PF.HR], view: [C.IT] } },
          { name: 'Templates & branding', access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [PF.RO] } },
          { name: 'User channel preferences & subscriptions', access: { self: [...EMPS, ...MGRS, C.HR, C.SA, C.IT, C.FC] } },
          { name: 'Push-notification events (mobile)', access: { manage: [P.SA, C.IT], view: [C.HR] } },
        ],
      },
      {
        code: 'F8',
        name: 'Template Engine',
        purpose: 'Generate letters, certificates, offers and emails from merge fields.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [C.FC, PF.RO] },
        subs: [
          { name: 'Template library (~18 types)', access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [PF.RO] } },
          { name: 'Merge fields (employee/position/company/custom)', access: { manage: [C.HR], view: [C.SA, PF.RO] } },
          { name: 'Generation modes (manual/workflow/batch → PDF)', access: { manage: [C.HR], edit: [PF.HR], view: [C.FC] } },
          { name: 'Approval & signing-authority tracking', access: { manage: [C.SA, C.HR], approve: [C.SA], view: [PF.RO] } },
          { name: 'Version history & reissue', access: { manage: [C.HR], view: [C.FC, PF.RO] } },
        ],
      },
      {
        code: 'F9',
        name: 'Custom Fields & Extensibility',
        purpose: 'Let customers extend core entities without code.',
        access: { manage: [P.SA, C.SA], edit: [C.HR], view: [C.IT, PF.RO] },
        subs: [
          { name: 'Field definitions (Company/Location/Dept/Group/Position/Employee)', access: { manage: [P.SA, C.SA], edit: [C.HR], view: [PF.RO] } },
          { name: 'Scope levels (platform / company)', access: { manage: [P.SA, C.SA], view: [C.IT] } },
          { name: 'Data types & validation behaviours', access: { manage: [C.SA], edit: [C.HR], view: [C.IT] } },
          { name: 'Search / workflow / report exposure', access: { manage: [C.SA], view: [C.HR, PF.RO] } },
        ],
      },
      {
        code: 'F10',
        name: 'Data Import / Export & Migration',
        purpose: 'Bulk-load and extract master and transactional data safely.',
        access: { manage: [C.SA, C.HR], edit: [P.OA, PF.HR], view: [PF.RO] },
        subs: [
          { name: 'Master-data import (Company/Dept/Location/Group/Employee)', access: { manage: [C.SA, C.HR], edit: [P.OA, PF.HR], view: [PF.RO] } },
          { name: 'Transactional import (Leave/Attendance/feeders)', access: { manage: [C.HR], edit: [PF.HR], view: [C.FC] } },
          { name: 'Dependency sequencing', access: { manage: [C.HR], view: [P.OA] } },
          { name: 'Pre-import validation & sandbox', access: { manage: [C.HR], edit: [P.OA], view: [PF.RO] } },
          { name: 'Transactional rollback', access: { manage: [C.HR, C.SA], view: [P.SC] } },
          { name: 'Real-time status tracking', access: { view: [C.HR, C.SA, P.OA, PF.RO] } },
        ],
      },
      {
        code: 'F11',
        name: 'Integrations Framework',
        purpose: 'Connect external systems; Phase-1-scoped, extensible.',
        access: { manage: [P.SA, C.IT], edit: [C.SA], view: [P.OA, PF.RO] },
        subs: [
          { name: 'Auth providers (SAML/AD/O365/Google)', access: { manage: [P.SA, C.IT], view: [C.SA] } },
          { name: 'Attendance-device / file ingestion', access: { manage: [C.IT, C.HR], view: [PF.RO] } },
          { name: 'Signed HTTPS webhooks (company-level)', access: { manage: [C.IT, C.SA], view: [PF.RO] } },
          { name: 'Pluggable-connector framework', access: { manage: [P.SA], view: [C.IT, PF.RO] } },
        ],
      },
      {
        code: 'F12',
        name: 'Documents & Attachments',
        purpose: 'Secure document storage across entities, with expiry and role-based access.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR, M.DH], self: [...EMPS], view: [C.FC, PF.RO] },
        subs: [
          { name: 'Entity attachments (Company/Employee/Candidate)', access: { manage: [C.HR], edit: [PF.HR, M.DH], self: [...EMPS], view: [C.FC] } },
          { name: 'Metadata, categorisation & expiry tracking', access: { manage: [C.HR], edit: [PF.HR], view: [C.FC, PF.RO] } },
          { name: 'Encryption at rest & tenant isolation', access: { manage: [P.SA, C.IT], view: [P.SC] } },
          { name: 'Role-based access controls', access: { manage: [C.HR, C.IT], view: [PF.RO] } },
        ],
      },
      {
        code: 'F13',
        name: '⭐ Company Setup Wizard',
        purpose: 'Take a new company live in 2–3 days by orchestrating every module’s configuration.',
        access: { manage: [P.SA, C.SA], edit: [P.OA, PF.M], view: [PF.RO] },
        subs: [
          { name: 'Entry modes (blueprint / clone / scratch / AI pre-fill)', access: { manage: [P.SA, C.SA], edit: [PF.M], view: [PF.RO] } },
          { name: 'Dependency-aware guided steps', access: { manage: [C.SA], edit: [P.OA, PF.M], view: [PF.RO] } },
          { name: 'Readiness score & validation gates', access: { manage: [C.SA], view: [P.OA, PF.RO] } },
          { name: 'AI pre-fill review (suggested, never auto-committed)', access: { manage: [C.SA, C.HR], edit: [P.OA], view: [PF.RO] } },
          { name: 'Config write-through (same module APIs)', access: { manage: [C.SA], view: [P.SC] } },
        ],
      },
    ],
  },
  {
    code: 'D1',
    name: 'Organization & Master Data',
    blurb: 'The structural backbone and the applicability dimensions used everywhere: company, jurisdiction, location, department, group, workforce-type.',
    modules: [
      {
        code: 'O1',
        name: 'Jurisdictions',
        purpose: 'Platform-managed catalog of operational regions driving policy applicability & statutory enablement.',
        access: { manage: [P.SA], edit: [P.OA], view: [C.SA, C.HR, PF.RO, C.FC] },
        subs: [
          { name: 'Jurisdiction catalog', access: { manage: [P.SA], edit: [P.OA], view: [C.SA, C.HR] } },
          { name: 'Tax / fee applicability', access: { manage: [P.SA], view: [C.HR, C.FC] } },
          { name: 'Company ↔ jurisdiction mapping', access: { manage: [P.SA, C.SA], view: [PF.RO] } },
          { name: 'Statutory profile (feeds payroll defaults)', compDark: true, access: { manage: [P.SA], view: [C.HR, C.FC] } },
        ],
      },
      {
        code: 'O2',
        name: 'Locations',
        purpose: 'Physical operating sites, company-specific unless explicitly shared via a group relationship.',
        access: { manage: [C.SA, C.HR], approve: [G.CA], edit: [PF.M], view: [C.IT, PF.RO, G.RV, ...EMPS] },
        subs: [
          { name: 'Location master', access: { manage: [C.SA, C.HR], edit: [PF.M], view: [C.IT, ...EMPS] } },
          { name: 'Sharing / referencing across companies', access: { manage: [G.CA], approve: [G.CA], edit: [C.SA], view: [G.RV, PF.RO] } },
          { name: 'Multi-location within jurisdiction', access: { manage: [C.HR, C.SA], view: [M.DH, PF.RO] } },
        ],
      },
      {
        code: 'O3',
        name: 'Departments',
        purpose: 'The n-level organisational department hierarchy.',
        access: { manage: [C.SA, C.HR], edit: [PF.M], view: [...MGRS, PF.RO, C.FC, G.RV, ...EMPS] },
        subs: [
          { name: 'Department hierarchy (n-level)', access: { manage: [C.SA, C.HR], edit: [PF.M], view: [...MGRS, ...EMPS] } },
          { name: 'Department head designation', access: { manage: [C.HR, C.SA], view: [M.DH, PF.RO] } },
          { name: 'Employee assignment (1+)', access: { manage: [C.HR], edit: [M.DH], view: [M.FM, C.FC] } },
          { name: 'Usage in routing / policy / reporting', access: { manage: [C.SA, C.HR], view: [PF.RO] } },
        ],
      },
      {
        code: 'O4',
        name: 'Positions, Grades & Levels',
        purpose: 'Company-specific job positions with levels and pay grades.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [M.DH, PF.RO] },
        subs: [
          { name: 'Positions (one per department)', access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [M.DH, PF.RO] } },
          { name: 'Position levels', access: { manage: [C.HR], view: [M.DH, PF.RO] } },
          { name: 'Pay grades', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Consumption by recruitment / org chart / comp', access: { manage: [C.HR], view: [C.SA, PF.RO] } },
        ],
      },
      {
        code: 'O5',
        name: 'Groups',
        purpose: 'Logical groupings for eligibility, access and reporting (global + company, n-level).',
        access: { manage: [P.SA, C.SA, C.HR], edit: [PF.HR], view: [PF.RO, M.DH] },
        subs: [
          { name: 'Global groups (platform-created)', access: { manage: [P.SA], view: [C.SA, C.HR, PF.RO] } },
          { name: 'Company-specific groups', access: { manage: [C.SA, C.HR], edit: [PF.HR], view: [PF.RO] } },
          { name: 'N-level nesting', access: { manage: [C.HR], view: [M.DH, PF.RO] } },
          { name: 'Applicability / access / reporting usage', access: { manage: [C.HR, C.SA], view: [PF.RO] } },
        ],
      },
      {
        code: 'O6',
        name: 'Org Chart & Hierarchy',
        purpose: 'Visualise reporting and functional structure with cross-company (authorised) views.',
        access: { manage: [C.HR], view: [C.SA, C.IT, C.FC, ...MGRS, ...EMPS, PF.M, PF.RO, G.CA, G.RV, P.SA] },
        subs: [
          { name: 'Interactive tree (primary + dotted-line)', access: { manage: [C.HR], view: [C.SA, ...MGRS, ...EMPS] } },
          { name: 'Views (reporting / department / functional)', access: { manage: [C.HR], view: [...MGRS, ...EMPS, PF.RO] } },
          { name: 'Export to PNG / PDF', access: { view: [C.HR, C.SA, ...MGRS, G.RV] } },
          { name: 'Cross-company directory / chart', access: { view: [G.CA, G.RV, PF.M, PF.RO] } },
          { name: 'Contact-field privacy config', access: { manage: [C.HR, C.SA], view: [C.IT] } },
        ],
      },
      {
        code: 'O7',
        name: 'Calendar & Holidays',
        purpose: 'Company/location holiday calendars and closures feeding leave & attendance.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [...MGRS, ...EMPS, C.FC] },
        subs: [
          { name: 'Company & location holiday calendars', access: { manage: [C.HR], edit: [PF.HR], view: [...MGRS, ...EMPS] } },
          { name: 'Optional holidays (employee election)', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
          { name: 'Office closures', access: { manage: [C.HR, C.SA], view: [...EMPS, C.FC] } },
          { name: 'Feed to leave (A1) & attendance (A2)', access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'O8',
        name: 'HR Policy Library',
        purpose: 'Author, version, distribute and track acknowledgment of policies.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR], approve: [C.SA], self: [...EMPS], view: [M.DH, C.FC, PF.RO] },
        subs: [
          { name: 'Policy authoring, versioning & effective dating', access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [PF.RO] } },
          { name: 'Distribution scope (AND/OR applicability)', access: { manage: [C.HR], edit: [PF.HR], view: [M.DH] } },
          { name: 'Distribution methods (manual/scheduled/auto/bulk)', access: { manage: [C.HR], view: [PF.RO] } },
          { name: 'Acknowledgment types (required/optional/read-only)', access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Due dates, reminders & escalations', access: { manage: [C.HR], view: [M.DH, C.FC] } },
          { name: 'Re-acknowledgment triggers', access: { manage: [C.HR], view: [PF.RO] } },
          { name: 'Employee self-service policy inbox', access: { self: [...EMPS, ...MGRS] } },
          { name: 'Acknowledgment reporting & compliance dashboard', access: { view: [C.HR, C.SA, C.FC, M.DH, PF.RO] } },
        ],
      },
      {
        code: 'O9',
        name: 'Announcements',
        purpose: 'Targeted organisational messaging sharing the policy applicability engine.',
        access: { manage: [C.HR, C.SA], edit: [M.DH, PF.HR], view: [...EMPS, M.FM, C.FC] },
        subs: [
          { name: 'Publish & targeting', access: { manage: [C.HR, C.SA], edit: [M.DH, PF.HR], view: [...EMPS] } },
          { name: 'Scheduling & expiry', access: { manage: [C.HR], edit: [PF.HR], view: [C.FC] } },
          { name: 'Review-before-publish workflow', access: { manage: [C.SA, C.HR], approve: [C.SA], view: [PF.RO] } },
          { name: 'View announcements (audience)', access: { self: [...EMPS, ...MGRS] } },
        ],
      },
      {
        code: 'O10',
        name: 'Agreements',
        purpose: 'Employment agreements, bonds and NDAs as trackable records.',
        access: { manage: [C.HR], edit: [PF.HR], self: [...EMPS], view: [C.FC, PF.RO] },
        subs: [
          { name: 'Agreement generation (via F8) & storage (F12)', access: { manage: [C.HR], edit: [PF.HR], view: [C.FC] } },
          { name: 'Types, templates & expiry rules', access: { manage: [C.HR], view: [PF.RO] } },
          { name: 'Acknowledgment tracking (via W11)', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
        ],
      },
      {
        code: 'O11',
        name: 'HR Budget / Headcount Planning',
        purpose: 'Plan headcount and cost against the org structure.',
        compDark: true,
        access: { manage: [C.HR, C.SA], edit: [M.DH], view: [C.FC, PF.RO] },
        subs: [
          { name: 'Budgets per period & department (headcount)', access: { manage: [C.HR, C.SA], edit: [M.DH], view: [C.FC] } },
          { name: 'Planned cost', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Requisition validation (block/warn)', access: { manage: [C.HR], view: [M.DH, C.FC] } },
          { name: 'Variance reporting', compDark: true, access: { manage: [C.HR], view: [C.FC, PF.RO] } },
        ],
      },
    ],
  },
  {
    code: 'D2',
    name: 'Talent Acquisition',
    blurb: 'From a hiring need to a converted employee; configurable per company.',
    modules: [
      {
        code: 'T1',
        name: 'Requisition & Approvals',
        purpose: 'Raise, approve and track job requisitions tied to a position.',
        access: { manage: [C.HR], edit: [...MGRS], approve: [C.SA, M.DH], view: [PF.HR, C.FC, PF.RO] },
        subs: [
          { name: 'Requisition creation (position-tied)', access: { manage: [C.HR], edit: [...MGRS], view: [PF.HR] } },
          { name: 'HR Budget validation (O11)', access: { manage: [C.HR], approve: [M.DH], view: [C.FC] } },
          { name: 'Approval workflow (F6)', access: { approve: [C.SA, M.DH], manage: [C.HR], view: [PF.RO] } },
          { name: 'Assignment to recruiters / hiring managers', access: { manage: [C.HR], edit: [M.DH], view: [M.FM] } },
        ],
      },
      {
        code: 'T2',
        name: 'Sourcing & Talent Pool',
        purpose: 'Source candidates and maintain a talent pool.',
        access: { manage: [C.HR], edit: [PF.HR], self: [W.CA], view: [M.DH] },
        subs: [
          { name: 'Job vacancies & posting', access: { manage: [C.HR], edit: [PF.HR], view: [M.DH] } },
          { name: 'Candidate / talent pool & status tracking', access: { manage: [C.HR], edit: [PF.HR], view: [M.DH] } },
          { name: 'Bulk resume upload', access: { manage: [C.HR], edit: [PF.HR] } },
          { name: 'Email-to-talent-pool ingestion', access: { manage: [C.HR], view: [PF.HR] } },
          { name: 'Candidate application (self)', access: { self: [W.CA] } },
        ],
      },
      {
        code: 'T3',
        name: 'Hiring Pipeline & Interviews',
        purpose: 'Move candidates through stages with structured evaluation.',
        access: { manage: [C.HR], edit: [M.DH, W.PM], self: [W.CA], view: [PF.HR, M.FM] },
        subs: [
          { name: 'Pipeline stages (review→schedule→feedback→hold)', access: { manage: [C.HR], edit: [M.DH], view: [PF.HR] } },
          { name: 'Interview panels & calendar scheduling', access: { manage: [C.HR], edit: [W.PM, M.DH], self: [W.CA] } },
          { name: 'Structured scorecards', access: { manage: [C.HR], edit: [W.PM, M.DH], view: [M.FM] } },
          { name: 'Reference checks (in-house / email)', access: { manage: [C.HR], edit: [PF.HR] } },
          { name: 'Advance / hold / reject decision', access: { manage: [C.HR], approve: [M.DH], view: [W.PM] } },
        ],
      },
      {
        code: 'T4',
        name: 'Offer Management',
        purpose: 'Approve, release and resolve offers.',
        compDark: true,
        access: { manage: [C.HR], approve: [C.SA, M.DH], self: [W.CA], view: [C.FC] },
        subs: [
          { name: 'Offer approval', access: { manage: [C.HR], approve: [C.SA, M.DH], view: [C.FC] } },
          { name: 'Offer compensation details', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Offer letter generation (F8)', access: { manage: [C.HR], view: [PF.HR] } },
          { name: 'Release / accept / refuse / cancel', access: { manage: [C.HR], self: [W.CA], view: [M.DH] } },
          { name: 'Joining & appointment letters', access: { manage: [C.HR], self: [W.CA] } },
        ],
      },
      {
        code: 'T5',
        name: 'Pre-Onboarding Checklist',
        purpose: 'Bridge offer-accept to day 1; candidate converts to employee.',
        access: { manage: [C.HR], edit: [PF.HR], self: [W.CA], view: [M.DH] },
        subs: [
          { name: 'Configurable checklist (documents / forms)', access: { manage: [C.HR], edit: [PF.HR], self: [W.CA] } },
          { name: 'Candidate → employee handoff (W2/W1)', access: { manage: [C.HR], view: [M.DH] } },
        ],
      },
    ],
  },
  {
    code: 'D3',
    name: 'Core Workforce & Lifecycle',
    blurb: 'The employee record and every event from joining to leaving. The Employee Master is the most-referenced entity.',
    modules: [
      {
        code: 'W1',
        name: 'Employee Master',
        purpose: 'The central, company-specific employee record.',
        access: { manage: [C.HR], edit: [PF.HR], view: [C.SA, C.IT, C.FC, ...MGRS, PF.RO, G.RV], self: [...EMPS] },
        subs: [
          { name: 'Employee record (company-specific)', access: { manage: [C.HR], edit: [PF.HR], view: [C.SA, ...MGRS], self: [...EMPS] } },
          { name: 'User linkage (optional)', access: { manage: [C.HR, C.IT], view: [C.SA] } },
          { name: 'Org assignments (jurisdiction/dept/position/group/location)', access: { manage: [C.HR], edit: [PF.HR], view: [...MGRS] } },
          { name: 'Manager hierarchy (effective-dated, no cycles)', access: { manage: [C.HR], edit: [M.DH], view: [M.FM, PF.RO] } },
          { name: 'Duplicate detection (Aadhaar/PAN/Passport)', access: { manage: [C.HR], view: [C.IT] } },
          { name: 'Statutory workforce data (UAN/ESIC/PF/PT/LWF…)', access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Compensation attributes', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'W2',
        name: 'Onboarding & Orientation',
        purpose: 'Bring a new hire to productivity via a task-driven checklist.',
        access: { manage: [C.HR], edit: [M.DH, PF.HR], self: [...EMPS], view: [C.FC] },
        subs: [
          { name: 'Onboarding checklist (mandatory stages)', access: { manage: [C.HR], edit: [M.DH], self: [...EMPS] } },
          { name: 'Document submission & verification (F12)', access: { manage: [C.HR], edit: [PF.HR], self: [...EMPS] } },
          { name: 'Asset assignment (→ S1)', access: { manage: [C.HR, C.IT], edit: [M.DH], view: [C.FC] } },
          { name: 'Induction', access: { manage: [C.HR], edit: [M.DH], self: [...EMPS] } },
          { name: 'Orientation program (sessions/curriculum)', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
        ],
      },
      {
        code: 'W3',
        name: 'New Joinees',
        purpose: 'Track recent hires in their first window with overdue flags.',
        access: { manage: [C.HR], view: [M.DH, PF.HR, C.FC] },
        subs: [
          { name: 'HR view of onboarding/probation window', access: { manage: [C.HR], view: [M.DH, PF.HR] } },
          { name: 'Pending tasks / document gaps / induction', access: { manage: [C.HR], view: [M.DH] } },
          { name: 'Configurable window & overdue definitions', access: { manage: [C.HR, C.SA], view: [PF.RO] } },
        ],
      },
      {
        code: 'W4',
        name: 'Confirmation',
        purpose: 'Probation → confirmation decision with periodic and peer reviews.',
        access: { manage: [C.HR], approve: [M.DH, C.SA], edit: [M.FM], self: [...EMPS], view: [PF.HR] },
        subs: [
          { name: 'Confirmation / periodic / peer question sets', access: { manage: [C.HR], edit: [M.DH], view: [PF.HR] } },
          { name: 'Approval hierarchy (Mgr→Dept Head→HR)', access: { approve: [M.DH, C.SA], manage: [C.HR], view: [PF.RO] } },
          { name: 'Peer-review responses (optionally anonymous)', access: { self: [...EMPS, ...MGRS], manage: [C.HR] } },
          { name: 'Outcomes (Confirm/Extend/Separate)', access: { manage: [C.HR], approve: [M.DH], view: [C.FC] } },
        ],
      },
      {
        code: 'W5',
        name: 'Transfers & Class Change',
        purpose: 'Move employees across structure and change employment class.',
        access: { manage: [C.HR], edit: [M.DH], approve: [C.SA], view: [PF.HR, C.FC] },
        subs: [
          { name: 'Inter-dept / location / company transfers', access: { manage: [C.HR], edit: [M.DH], approve: [C.SA], view: [PF.HR] } },
          { name: 'Employee class change', access: { manage: [C.HR], approve: [C.SA], view: [C.FC] } },
          { name: 'Effective dating & impact assessment', access: { manage: [C.HR], view: [M.DH, C.FC] } },
        ],
      },
      {
        code: 'W6',
        name: 'Disciplinary Actions',
        purpose: 'Log and process disciplinary cases (sensitive, restricted access).',
        restricted: true,
        access: { manage: [C.HR], approve: [C.SA], view: [M.DH] },
        subs: [
          { name: 'Case logging (type, description, workflow)', restricted: true, access: { manage: [C.HR], approve: [C.SA], view: [M.DH] } },
          { name: 'Role-restricted access & audit (F5)', restricted: true, access: { manage: [C.HR], view: [P.SC, C.SA] } },
          { name: 'Gating of confirmation (W4) / exit (W8)', access: { manage: [C.HR], view: [M.DH] } },
        ],
      },
      {
        code: 'W7',
        name: 'Knowledge Transfer',
        purpose: 'Capture handover on exit/transfer.',
        access: { manage: [C.HR], edit: [M.DH], self: [...EMPS], view: [M.FM] },
        subs: [
          { name: 'KT tasks (to provide / to receive)', access: { self: [...EMPS, ...MGRS], manage: [C.HR] } },
          { name: 'Team KT views', access: { view: [M.DH, M.FM], manage: [C.HR] } },
          { name: 'KT as exit-clearance item', access: { manage: [C.HR], edit: [M.DH], view: [C.FC] } },
        ],
      },
      {
        code: 'W8',
        name: 'Exit & Offboarding',
        purpose: 'Process resignations, clearances and layoffs; hand settlement to payroll.',
        access: { manage: [C.HR], approve: [C.SA, M.DH], edit: [C.IT, C.FC], self: [...EMPS], view: [PF.HR] },
        subs: [
          { name: 'Resignation / initiation', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
          { name: 'Notice period', access: { manage: [C.HR], approve: [M.DH], view: [PF.HR] } },
          { name: 'Parallel clearance (IT / Finance / HR / Manager)', access: { manage: [C.HR], edit: [C.IT, C.FC, M.DH], approve: [M.DH] } },
          { name: 'Layoff list (involuntary)', access: { manage: [C.HR], approve: [C.SA], view: [C.FC] } },
          { name: 'Exit questionnaire / interview', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
          { name: 'Final-settlement hand-off to D6', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Payroll lock date', access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'W9',
        name: 'Employee Self-Service & Directory',
        purpose: 'Let employees manage their info and find colleagues (no comp visibility).',
        access: { self: [...EMPS, ...MGRS], manage: [C.HR], view: [C.SA, C.IT, C.FC, PF.RO, G.RV] },
        subs: [
          { name: 'Profile view / update (authorised fields)', access: { self: [...EMPS, ...MGRS], manage: [C.HR] } },
          { name: 'Leave / attendance self-service', access: { self: [...EMPS, ...MGRS], view: [C.HR] } },
          { name: 'Documents & feedback self-service', access: { self: [...EMPS, ...MGRS], manage: [C.HR] } },
          { name: 'Directory & search (privacy-controlled)', access: { view: [...EMPS, ...MGRS, C.HR, C.SA, C.IT, C.FC, G.RV] } },
          { name: 'Cross-company directory (authorised group roles)', access: { view: [G.CA, G.RV, PF.M, PF.RO] } },
          { name: 'Sensitive-field edits route to approval', access: { manage: [C.HR], approve: [C.HR], self: [...EMPS] } },
        ],
      },
      {
        code: 'W10',
        name: 'Mass Updates & Bulk Ops',
        purpose: 'Operate on many employees at once with validation + rollback.',
        access: { manage: [C.HR, C.SA], edit: [PF.HR], view: [PF.RO] },
        subs: [
          { name: 'Bulk employee-data updates', access: { manage: [C.HR], edit: [PF.HR], view: [PF.RO] } },
          { name: 'Mass approvals', access: { manage: [C.HR], approve: [C.SA], view: [PF.RO] } },
          { name: 'Validation, rollback & audit', access: { manage: [C.HR, C.SA], view: [P.SC] } },
        ],
      },
      {
        code: 'W11',
        name: 'Employee Acknowledgements',
        purpose: 'Central record of what each employee acknowledged.',
        access: { manage: [C.HR], self: [...EMPS], view: [M.DH, C.FC, PF.RO] },
        subs: [
          { name: 'Aggregated acknowledgments (policies/assets/letters)', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
          { name: 'Timestamp + receipt & retention', access: { manage: [C.HR], view: [C.FC, PF.RO] } },
          { name: 'Gating of confirmation / exit', access: { manage: [C.HR], view: [M.DH] } },
        ],
      },
    ],
  },
  {
    code: 'D4',
    name: 'Time, Attendance & Leave',
    blurb: 'The primary feeder for payroll computation; everything here is modelled computation-ready.',
    modules: [
      {
        code: 'A1',
        name: 'Leave / Time Off',
        purpose: 'Manage leave policies, balances, requests and approvals.',
        access: { manage: [C.HR], approve: [M.DH, M.FM], self: [...EMPS], view: [C.FC, PF.HR] },
        subs: [
          { name: 'Leave policies (by type/group/jurisdiction…)', access: { manage: [C.HR], edit: [PF.HR], view: [PF.RO] } },
          { name: 'Leave types (PL/CL/SL/Maternity/…/Comp-off)', access: { manage: [C.HR], view: [...EMPS, M.DH] } },
          { name: 'Balances (accrual/carry-forward/LOP/encashment)', access: { manage: [C.HR], self: [...EMPS], view: [C.FC] } },
          { name: 'Requests & approvals (sequential/parallel)', access: { approve: [M.DH, M.FM], self: [...EMPS], manage: [C.HR] } },
          { name: 'HR override (reason + audit)', access: { manage: [C.HR], view: [P.SC] } },
          { name: 'Calendars (personal / team / company)', access: { self: [...EMPS], view: [M.DH, C.HR] } },
        ],
      },
      {
        code: 'A2',
        name: 'Attendance Tracking',
        purpose: 'Capture and manage attendance, shifts and exceptions — the richest config area.',
        access: { manage: [C.HR], approve: [M.DH, M.FM], self: [...EMPS], view: [C.FC, PF.HR] },
        subs: [
          { name: 'Capture (in-house module / manual / CSV import)', access: { manage: [C.HR, C.IT], self: [...EMPS], view: [M.DH] } },
          { name: 'Shifts, rosters & shift-swap', access: { manage: [C.HR], approve: [M.DH], self: [...EMPS] } },
          { name: 'Flexi schedules & work-from-home', access: { manage: [C.HR], approve: [M.DH], self: [...EMPS] } },
          { name: 'Overtime (calc & categorisation)', access: { manage: [C.HR], approve: [M.DH], self: [...EMPS] } },
          { name: 'Comp-off (feeds A1)', access: { manage: [C.HR], approve: [M.DH], self: [...EMPS] } },
          { name: 'Exceptions / regularization requests', access: { self: [...EMPS], approve: [M.DH, M.FM], manage: [C.HR] } },
          { name: 'Mass approval & manual attendance sheet', access: { manage: [C.HR], approve: [M.DH] } },
          { name: 'Attendance audit (habitual violators)', access: { manage: [C.HR], view: [M.DH, C.FC, P.SC] } },
          { name: 'Statutory working hours & weekly-off', access: { manage: [C.HR], view: [C.FC] } },
          { name: 'HR override (reason + audit)', access: { manage: [C.HR], view: [P.SC] } },
        ],
      },
      {
        code: 'A3',
        name: 'Timesheets / Time Management',
        purpose: 'Record time against work and measure utilization.',
        access: { manage: [C.HR], approve: [M.DH, M.FM], self: [...EMPS], view: [C.FC] },
        subs: [
          { name: 'Timesheet entry & detail (configurable granularity)', access: { self: [...EMPS], manage: [C.HR], view: [M.DH] } },
          { name: 'Utilization summaries', access: { view: [M.DH, M.FM, C.HR, C.FC] } },
          { name: 'Timesheet approvals (F6)', access: { approve: [M.DH, M.FM], manage: [C.HR] } },
          { name: 'Link to allocation (A4) & feed to D6', access: { manage: [C.HR], view: [M.FM, C.FC] } },
        ],
      },
      {
        code: 'A4',
        name: 'Resource & Project Allocation',
        purpose: 'Allocate people to projects/tasks with day-wise resourcing.',
        access: { manage: [C.HR], edit: [M.FM, M.DH], self: [...EMPS], view: [PF.HR] },
        subs: [
          { name: 'Project master & task library', access: { manage: [C.HR, M.FM], view: [M.DH] } },
          { name: 'Employee allocation (day-wise)', access: { edit: [M.FM, M.DH], self: [...EMPS], manage: [C.HR] } },
          { name: 'Bulk resource assignment', access: { manage: [C.HR], edit: [M.FM], view: [M.DH] } },
          { name: 'Inform timesheet / utilization (A3)', access: { manage: [C.HR], view: [M.FM] } },
        ],
      },
    ],
  },
  {
    code: 'D5',
    name: 'Performance, Growth & Engagement',
    blurb: 'How people are evaluated, heard, grown, surveyed and recognised — all review types fully configurable.',
    modules: [
      {
        code: 'P1',
        name: 'Performance Review',
        purpose: 'Evaluate and rate performance across configurable cycles.',
        access: { manage: [C.HR], edit: [M.DH, M.FM], approve: [C.SA], self: [...EMPS], view: [PF.HR] },
        subs: [
          { name: 'Review types (check-ins/annual/periodic/peer/quadrant)', access: { manage: [C.HR], edit: [M.DH], view: [PF.RO] } },
          { name: 'Manager- or HR-initiated reviews', access: { edit: [M.DH, M.FM], manage: [C.HR], self: [...EMPS] } },
          { name: 'Ratings per criteria / scales', access: { edit: [M.DH], manage: [C.HR], self: [...EMPS] } },
          { name: 'Confirmation (W4) integration', access: { manage: [C.HR], view: [M.DH] } },
          { name: 'Outcomes → reporting (D8)', access: { manage: [C.HR], view: [C.FC, PF.M] } },
        ],
      },
      {
        code: 'P2',
        name: 'Feedback / Grievance',
        purpose: 'Structured channel for feedback and grievances (anonymous option, restricted access).',
        restricted: true,
        access: { manage: [C.HR], edit: [C.SA], self: [...EMPS, ...MGRS], view: [PF.RO] },
        subs: [
          { name: 'Submission (with anonymous option)', access: { self: [...EMPS, ...MGRS], manage: [C.HR] } },
          { name: 'Role-based review & status tracking', restricted: true, access: { manage: [C.HR], edit: [C.SA], view: [PF.RO] } },
          { name: 'Restricted access to grievance data', restricted: true, access: { manage: [C.HR], view: [C.SA, P.SC] } },
        ],
      },
      {
        code: 'P3',
        name: 'Learning Management',
        purpose: 'Training, enrollment and certifications.',
        access: { manage: [C.HR], edit: [M.DH], approve: [M.DH], self: [...EMPS], view: [C.FC] },
        subs: [
          { name: 'Training programs', access: { manage: [C.HR], edit: [M.DH], view: [...EMPS] } },
          { name: 'My training / learning requests', access: { self: [...EMPS, ...MGRS] } },
          { name: 'Certifications (with expiry)', access: { manage: [C.HR], self: [...EMPS], view: [M.DH] } },
          { name: 'Enrollment', access: { self: [...EMPS], manage: [C.HR], edit: [M.DH] } },
          { name: 'Training mass approval', access: { approve: [M.DH], manage: [C.HR] } },
        ],
      },
      {
        code: 'P4',
        name: 'Surveys',
        purpose: 'Author and run surveys with configurable anonymity.',
        access: { manage: [C.HR], edit: [C.SA], self: [...EMPS, ...MGRS], view: [PF.RO] },
        subs: [
          { name: 'Survey authoring (questionnaire builder)', access: { manage: [C.HR], edit: [C.SA], view: [PF.RO] } },
          { name: 'Distribution & targeting (D1 dimensions)', access: { manage: [C.HR], view: [M.DH] } },
          { name: 'Response collection', access: { self: [...EMPS, ...MGRS], view: [C.HR] } },
          { name: 'Anonymity configuration', access: { manage: [C.HR], view: [P.SC] } },
        ],
      },
      {
        code: 'P5',
        name: 'Rewards & Appreciation',
        purpose: 'Recognise employees; feed engagement reporting.',
        access: { manage: [C.HR], edit: [M.DH], self: [...EMPS, M.FM], view: [C.FC] },
        subs: [
          { name: 'Appreciation summary / details', access: { self: [...EMPS, ...MGRS], view: [C.HR] } },
          { name: 'Peer / manager recognition', access: { edit: [M.DH, M.FM], self: [...EMPS], manage: [C.HR] } },
          { name: 'Engagement reporting feed (D8)', access: { manage: [C.HR], view: [C.FC, PF.M] } },
        ],
      },
    ],
  },
  {
    code: 'D6',
    name: 'Compensation & Payroll Computation',
    blurb: '⭐ Entirely comp-dark — HR/Admin only. Computes payroll to a per-company spec and outputs data for external disbursement & filing.',
    modules: [
      {
        code: 'C1',
        name: 'Compensation Structure',
        purpose: 'Define salary structures and pay components per company.',
        compDark: true,
        access: { manage: [C.HR], view: [C.FC] },
        subs: [
          { name: 'Salary structures (mapped to grades)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Pay components (earning/deduction/benefit)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Benefit-as-pay-component (Q6)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Employee compensation records', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'C2',
        name: 'Salary Revision',
        purpose: 'Manage increments and revisions with effective dating and history.',
        compDark: true,
        access: { manage: [C.HR], view: [C.FC] },
        subs: [
          { name: 'Revision workflow & questionnaire', compDark: true, access: { manage: [C.HR], approve: [C.HR], view: [C.FC] } },
          { name: 'Effective dating & full history', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Cycle triggers (confirmation / performance)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'C4',
        name: 'Tax Planning & Declarations',
        purpose: 'Capture declarations, deductions, exemptions, LTA and arrears — HR/Admin-managed only.',
        compDark: true,
        access: { manage: [C.HR], view: [C.FC] },
        subs: [
          { name: 'Declaration categories & deductions', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Exemptions, LTA & arrears', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: '⭐ No employee-facing self-service (Phase 1)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'C5',
        name: 'Payroll Computation Engine',
        purpose: 'Compute payroll per a configurable per-company spec → data output. Computes & outputs only.',
        compDark: true,
        access: { manage: [C.HR], view: [C.FC] },
        subs: [
          { name: 'Input aggregation (C1/C4/D4/W8)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Editable India statutory templates (PF/ESI/PT/LWF/gratuity/bonus)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Gross → deductions → tax → net computation', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Excel / structured data output', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Gap report (no silent zeros)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Payroll lock date (from W8)', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
    ],
  },
  {
    code: 'D7',
    name: 'Operations & Services',
    blurb: 'Operational services around the workforce. In Phase 1: Assets and Travel & Expense.',
    modules: [
      {
        code: 'S1',
        name: 'Asset Tracking',
        purpose: 'Track assets across their lifecycle, integrated with onboarding and exit.',
        access: { manage: [C.IT, C.HR], edit: [M.DH], self: [...EMPS], view: [C.FC, PF.RO] },
        subs: [
          { name: 'Categories & inventory', access: { manage: [C.IT], edit: [C.HR], view: [C.FC] } },
          { name: 'Lifecycle states (available→…→disposed)', access: { manage: [C.IT], view: [C.HR, C.FC] } },
          { name: 'Transactions (issue/return/transfer/recover)', access: { manage: [C.IT, C.HR], edit: [M.DH], self: [...EMPS] } },
          { name: 'Digital acknowledgement (condition)', access: { self: [...EMPS], manage: [C.IT] } },
          { name: 'Workflow integration (onboarding/exit gating)', access: { manage: [C.IT, C.HR], view: [M.DH] } },
          { name: 'Reporting (assignment/overdue/inventory)', access: { view: [C.IT, C.HR, C.FC, PF.RO] } },
        ],
      },
      {
        code: 'S2',
        name: 'Travel & Expense',
        purpose: 'Manage travel requests, trips, advances and expense claims.',
        access: { manage: [C.HR], approve: [M.DH, M.FM, C.FC], self: [...EMPS], view: [PF.RO] },
        subs: [
          { name: 'Travel request & manager approval', access: { self: [...EMPS], approve: [M.DH, M.FM], manage: [C.HR] } },
          { name: 'Trip details & advances', access: { self: [...EMPS], manage: [C.HR], view: [C.FC] } },
          { name: 'Expense claims & finance approval', access: { self: [...EMPS], approve: [C.FC, M.DH], manage: [C.HR] } },
          { name: 'Advance-vs-actual reconciliation', access: { manage: [C.HR], approve: [C.FC], view: [PF.RO] } },
          { name: 'Reimbursement output', access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
    ],
  },
  {
    code: 'D8',
    name: 'Insight',
    blurb: 'Turns everything captured into operational, compliance and management insight — under tenant and comp-dark security.',
    modules: [
      {
        code: 'R1',
        name: 'Reporting, Dashboards & Analytics',
        purpose: 'Standard, ad-hoc, scheduled and consolidated reporting.',
        access: { manage: [C.HR, C.SA], view: [C.FC, ...MGRS, PF.M, PF.RO, G.RV, P.SC] },
        subs: [
          { name: 'Standard reports (workforce/org/leave/attendance…)', access: { manage: [C.HR], view: [C.SA, ...MGRS, C.FC, PF.RO] } },
          { name: 'Ad-hoc report builder (incl. custom fields)', access: { manage: [C.HR, C.SA], view: [PF.M, PF.RO] } },
          { name: 'Scheduled delivery (email)', access: { manage: [C.HR], view: [C.FC] } },
          { name: 'Compliance report templates (PF/ESIC/registers)', access: { manage: [C.HR], view: [C.FC, PF.RO] } },
          { name: 'Consolidated portfolio/group reporting', access: { view: [PF.M, PF.RO, G.RV], manage: [PF.M] } },
          { name: '⭐ Compensation / payroll reports', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
      {
        code: 'R2',
        name: 'Home / Personalized Dashboards',
        purpose: 'Role-based landing experience surfacing what each user needs.',
        access: { manage: [C.HR], self: [...EMPS, ...MGRS], view: [C.SA, C.IT, C.FC, PF.M, PF.RO, G.CA, G.RV, P.SA, P.OA, P.SC, W.CA, W.PM] },
        subs: [
          { name: 'Role-default dashboards (KPIs/widgets/drill-down)', access: { manage: [C.HR, C.SA], view: [PF.M, PF.RO] } },
          { name: 'Pending-actions surface (approvals/acks/tasks)', access: { self: [...EMPS, ...MGRS], view: [C.HR, C.SA] } },
          { name: 'Employee personal dashboard (no comp)', access: { self: [...EMPS, ...MGRS] } },
        ],
      },
    ],
  },
  {
    code: 'D9',
    name: 'Channels (Mobile)',
    blurb: 'API coverage only — the native app is built by a separate team on SatelliteHR’s backend.',
    modules: [
      {
        code: 'M1',
        name: 'Mobile (API support only)',
        purpose: 'Expose every employee/manager self-service capability via documented REST APIs.',
        access: { manage: [P.SA, C.IT], edit: [C.SA], self: [...EMPS, ...MGRS], view: [C.HR, PF.RO] },
        subs: [
          { name: 'REST API coverage (ESS/leave/attendance/approvals…)', access: { manage: [P.SA, C.IT], edit: [C.SA], self: [...EMPS, ...MGRS] } },
          { name: 'OAuth2/JWT auth + company-context switching', access: { manage: [P.SA, C.IT], self: [...EMPS, ...MGRS] } },
          { name: 'Push-notification events (F7)', access: { manage: [P.SA, C.IT], view: [C.HR] } },
          { name: 'Signed HTTPS webhooks', access: { manage: [C.IT, P.SA], view: [PF.RO] } },
          { name: 'Server-side security (RBAC/tenant/context)', access: { manage: [P.SA, C.IT], view: [P.SC] } },
          { name: '⭐ Compensation remains dark on mobile', compDark: true, access: { manage: [C.HR], view: [C.FC] } },
        ],
      },
    ],
  },
]

// ─── Derived helpers for the UI ──────────────────────────────────────────────

export const ALL_MODULES = DOMAINS.flatMap((d) =>
  d.modules.map((m) => ({ domain: d, module: m }))
)

export function roleById(id: RoleId): RoleDef {
  return ROLES.find((r) => r.id === id)!
}

/** Count effective module-level access by level for a given role. */
export function roleSummary(role: RoleId): Record<Level, number> {
  const counts: Record<Level, number> = { manage: 0, edit: 0, approve: 0, view: 0, self: 0, none: 0 }
  for (const { module } of ALL_MODULES) counts[levelFor(module.access, role)]++
  return counts
}
