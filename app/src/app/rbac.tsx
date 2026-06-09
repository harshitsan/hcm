/* eslint-disable react-refresh/only-export-components */
/**
 * Dynamic RBAC store (mock, session state) — modeled on a governed access-control
 * console. Three axes:
 *   1. Module access  — hidden | read | edit   (which screens a role sees/edits)
 *   2. Field access   — hidden | masked | visible (sensitive HR fields)
 *   3. Action access  — boolean (consequential workflow actions)
 * Admins can CREATE roles and CHANGE access; every save is justified + logged.
 * 'Platform Super Admin' is a locked superuser (can never lose access).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type PermLevel = 'hidden' | 'read' | 'edit'
export type FieldLevel = 'hidden' | 'masked' | 'visible'
export type RoleLevel = 'Platform' | 'Portfolio' | 'Group' | 'Company' | 'Manager' | 'Employee'

export const ADMIN_ROLE = 'Platform Super Admin'

/* ---------------- governed surfaces ---------------- */
export const MODULE_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  { label: 'Platform & Governance', items: [
    { key: 'portfolio', label: 'Portfolio' }, { key: 'companies', label: 'Companies' },
    { key: 'company_setup', label: 'Company Setup' }, { key: 'shared_policies', label: 'Shared Policies' },
    { key: 'org_data', label: 'Org & Master Data' }, { key: 'roles', label: 'Roles & Security' },
    { key: 'import_export', label: 'Import / Export' }, { key: 'audit', label: 'Audit Log' },
  ]},
  { label: 'People', items: [
    { key: 'directory', label: 'Directory' }, { key: 'org_chart', label: 'Org Chart' },
    { key: 'employees', label: 'Employee Records' }, { key: 'assets', label: 'Assets' }, { key: 'letters', label: 'HR Letters' },
  ]},
  { label: 'Time & Lifecycle', items: [
    { key: 'leave', label: 'Leave' }, { key: 'attendance', label: 'Attendance' },
    { key: 'requisitions', label: 'Requisitions' }, { key: 'candidates', label: 'Candidates' },
    { key: 'interviews', label: 'Interviews' }, { key: 'onboarding', label: 'Onboarding' },
    { key: 'performance', label: 'Performance' }, { key: 'transfers_exit', label: 'Transfers & Exit' },
  ]},
  { label: 'Comms · Policy · Insights', items: [
    { key: 'announcements', label: 'Announcements' }, { key: 'feedback', label: 'Feedback' },
    { key: 'policies', label: 'Policies' }, { key: 'documents', label: 'Documents' },
    { key: 'reports', label: 'Reports' }, { key: 'workflow_builder', label: 'Workflow Builder' },
    { key: 'custom_fields', label: 'Custom Fields' },
  ]},
]
export const ALL_MODULES = MODULE_GROUPS.flatMap((g) => g.items)
export const MODULE_LABEL = new Map(ALL_MODULES.map((m) => [m.key, m.label]))

export const FIELDS: { key: string; label: string; hint: string; sample: string }[] = [
  { key: 'employee.salary', label: 'Compensation / CTC', hint: 'Pay & salary', sample: '₹24,00,000' },
  { key: 'employee.pan', label: 'PAN', hint: 'Tax identifier', sample: 'ABCDE1234F' },
  { key: 'employee.aadhaar', label: 'Aadhaar / UAN', hint: 'Statutory ID', sample: '4123 5678 9012' },
  { key: 'employee.bank', label: 'Bank account', hint: 'Payout details', sample: '•••• 6642' },
  { key: 'employee.address', label: 'Home address', hint: 'PII', sample: '12 MG Road, Pune' },
]
export const FIELD_LABEL = new Map(FIELDS.map((f) => [f.key, f.label]))

export const ACTION_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  { label: 'Approvals', items: [
    { key: 'leave.approve', label: 'Approve leave' }, { key: 'attendance.approve', label: 'Approve attendance' },
    { key: 'probation.confirm', label: 'Confirm probation' },
  ]},
  { label: 'Workforce', items: [
    { key: 'employee.create', label: 'Add employee' }, { key: 'employee.edit', label: 'Edit employee record' },
    { key: 'transfer.initiate', label: 'Initiate transfer' }, { key: 'exit.run', label: 'Run exit / offboarding' },
  ]},
  { label: 'Hiring', items: [
    { key: 'requisition.approve', label: 'Approve requisition' }, { key: 'offer.make', label: 'Make an offer' },
    { key: 'scorecard.submit', label: 'Submit interview scorecard' },
  ]},
  { label: 'Governance', items: [
    { key: 'company.provision', label: 'Provision a company' }, { key: 'company.suspend', label: 'Suspend a company' },
    { key: 'policy.publish', label: 'Publish a policy' }, { key: 'role.assign', label: 'Assign roles' },
    { key: 'data.import', label: 'Import data' }, { key: 'report.export', label: 'Export reports' },
  ]},
]
export const ALL_ACTIONS = ACTION_GROUPS.flatMap((g) => g.items)
export const ACTION_LABEL = new Map(ALL_ACTIONS.map((a) => [a.key, a.label]))

/* ---------------- built-in roles + their default access ---------------- */
type Def = { level: RoleLevel; users: number; desc: string; edit: string[]; read: string[]; actions: string[]; fields?: Record<string, FieldLevel> }

const BUILTIN: Record<string, Def> = {
  [ADMIN_ROLE]: { level: 'Platform', users: 2, desc: 'Full control of the platform; superuser.', edit: ['*'], read: [], actions: ['*'], fields: {} },
  'Platform Operations': {
    level: 'Platform', users: 4, desc: 'Tenant onboarding & support; no transactional HR edits.',
    edit: ['companies', 'company_setup', 'import_export'],
    read: ['portfolio', 'org_data', 'roles', 'audit', 'shared_policies', 'reports'],
    actions: ['company.provision', 'data.import'],
    fields: { 'employee.salary': 'hidden', 'employee.pan': 'masked', 'employee.aadhaar': 'masked', 'employee.bank': 'hidden' },
  },
  'Portfolio Manager': {
    level: 'Portfolio', users: 6, desc: 'Runs HR across authorized companies; context switching.',
    edit: ['portfolio', 'companies', 'shared_policies', 'org_data', 'employees', 'leave', 'attendance', 'requisitions', 'candidates', 'interviews', 'onboarding', 'performance', 'transfers_exit', 'announcements', 'feedback', 'policies', 'documents', 'letters', 'assets'],
    read: ['company_setup', 'roles', 'import_export', 'audit', 'directory', 'org_chart', 'reports', 'custom_fields', 'workflow_builder'],
    actions: ['leave.approve', 'attendance.approve', 'employee.create', 'employee.edit', 'requisition.approve', 'offer.make', 'policy.publish', 'report.export', 'transfer.initiate'],
    fields: { 'employee.salary': 'masked', 'employee.bank': 'masked' },
  },
  'Group Reporting Viewer': {
    level: 'Group', users: 3, desc: 'Read-only consolidated reports across a group.',
    edit: [], read: ['portfolio', 'reports', 'directory', 'org_chart', 'audit', 'policies'],
    actions: ['report.export'],
    fields: { 'employee.salary': 'hidden', 'employee.pan': 'hidden', 'employee.aadhaar': 'hidden', 'employee.bank': 'hidden', 'employee.address': 'masked' },
  },
  'Company HR Admin': {
    level: 'Company', users: 11, desc: 'Owns people, policies & reports for one company.',
    edit: ['directory', 'org_chart', 'employees', 'assets', 'letters', 'leave', 'attendance', 'requisitions', 'candidates', 'interviews', 'onboarding', 'performance', 'transfers_exit', 'announcements', 'feedback', 'policies', 'documents', 'org_data', 'custom_fields', 'workflow_builder'],
    read: ['reports', 'audit', 'roles', 'shared_policies'],
    actions: ['leave.approve', 'attendance.approve', 'probation.confirm', 'employee.create', 'employee.edit', 'transfer.initiate', 'exit.run', 'requisition.approve', 'offer.make', 'policy.publish', 'report.export'],
  },
  'Company IT / Security': {
    level: 'Company', users: 5, desc: 'User-role assignment, SSO, access audits.',
    edit: ['roles', 'audit', 'import_export'],
    read: ['directory', 'org_chart', 'employees', 'company_setup', 'custom_fields'],
    actions: ['role.assign', 'data.import'],
    fields: { 'employee.salary': 'hidden', 'employee.pan': 'masked', 'employee.aadhaar': 'masked', 'employee.bank': 'hidden' },
  },
  'People Manager': {
    level: 'Manager', users: 38, desc: 'Approves their team’s requests; lifecycle actions.',
    edit: ['leave', 'attendance', 'onboarding', 'performance'],
    read: ['directory', 'org_chart', 'employees', 'requisitions', 'candidates', 'interviews', 'transfers_exit', 'announcements', 'documents', 'letters'],
    actions: ['leave.approve', 'attendance.approve', 'probation.confirm', 'requisition.approve', 'scorecard.submit', 'transfer.initiate'],
    fields: { 'employee.salary': 'masked', 'employee.pan': 'hidden', 'employee.aadhaar': 'hidden', 'employee.bank': 'hidden' },
  },
  'Employee — Standard': {
    level: 'Employee', users: 268, desc: 'Default self-service for employees.',
    edit: ['profile' as string], // profile not in module list; harmless
    read: ['directory', 'org_chart', 'leave', 'attendance', 'announcements', 'policies', 'documents', 'letters', 'feedback'],
    actions: [],
    fields: { 'employee.salary': 'hidden', 'employee.pan': 'hidden', 'employee.aadhaar': 'hidden', 'employee.bank': 'hidden', 'employee.address': 'masked' },
  },
}

export type RoleInfo = { name: string; level: RoleLevel; users: number; desc: string; custom: boolean }

// a custom role carries its own baseline snapshot (cloned from a base role at creation)
type CustomRole = { name: string; level: RoleLevel; desc: string; modules: Record<string, PermLevel>; actions: Record<string, boolean>; fields: Record<string, FieldLevel> }

export type PolicyChangeItem = { kind: 'module' | 'field' | 'action'; target: string; from: string; to: string }
export type PolicyLogEntry = { id: string; actor: string; at: string; reason: string; items: PolicyChangeItem[] }
export type PolicyOverrides = { modules: Record<string, PermLevel>; fields: Record<string, FieldLevel>; actions: Record<string, boolean> }
export const EMPTY_POLICY: PolicyOverrides = { modules: {}, fields: {}, actions: {} }

/* ---------------- defaults (baseline) lookups ---------------- */
function builtinModule(role: string, key: string): PermLevel {
  const d = BUILTIN[role]; if (!d) return 'hidden'
  if (role === ADMIN_ROLE || d.edit.includes('*')) return 'edit'
  if (d.edit.includes(key)) return 'edit'
  if (d.read.includes(key)) return 'read'
  return 'hidden'
}
function builtinAction(role: string, key: string): boolean {
  const d = BUILTIN[role]; if (!d) return false
  if (role === ADMIN_ROLE || d.actions.includes('*')) return true
  return d.actions.includes(key)
}
function builtinField(role: string, key: string): FieldLevel {
  if (role === ADMIN_ROLE) return 'visible'
  return BUILTIN[role]?.fields?.[key] ?? 'visible'
}

type RbacState = {
  roles: RoleInfo[]
  policy: PolicyOverrides
  log: PolicyLogEntry[]
  defModule: (role: string, key: string) => PermLevel
  defAction: (role: string, key: string) => boolean
  defField: (role: string, key: string) => FieldLevel
  effModule: (role: string, key: string) => PermLevel
  effAction: (role: string, key: string) => boolean
  effField: (role: string, key: string) => FieldLevel
  addRole: (name: string, level: RoleLevel, desc: string, baseRole: string) => void
  savePolicy: (next: PolicyOverrides, items: PolicyChangeItem[], reason: string, actor: string) => void
  resetPolicy: (reason: string, actor: string) => void
}

const Ctx = createContext<RbacState | null>(null)

export function RbacProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<CustomRole[]>([])
  const [policy, setPolicy] = useState<PolicyOverrides>(EMPTY_POLICY)
  const [log, setLog] = useState<PolicyLogEntry[]>([])

  const value = useMemo<RbacState>(() => {
    const customByName = new Map(custom.map((c) => [c.name, c]))
    const defModule = (role: string, key: string): PermLevel => {
      if (role === ADMIN_ROLE) return 'edit'
      const c = customByName.get(role); if (c) return c.modules[key] ?? 'hidden'
      return builtinModule(role, key)
    }
    const defAction = (role: string, key: string): boolean => {
      if (role === ADMIN_ROLE) return true
      const c = customByName.get(role); if (c) return !!c.actions[key]
      return builtinAction(role, key)
    }
    const defField = (role: string, key: string): FieldLevel => {
      if (role === ADMIN_ROLE) return 'visible'
      const c = customByName.get(role); if (c) return c.fields[key] ?? 'visible'
      return builtinField(role, key)
    }
    const roles: RoleInfo[] = [
      ...Object.entries(BUILTIN).map(([name, d]) => ({ name, level: d.level, users: d.users, desc: d.desc, custom: false })),
      ...custom.map((c) => ({ name: c.name, level: c.level, users: 0, desc: c.desc, custom: true })),
    ]
    return {
      roles,
      policy,
      log,
      defModule, defAction, defField,
      effModule: (role, key) => role === ADMIN_ROLE ? 'edit' : (policy.modules[`${role}|${key}`] ?? defModule(role, key)),
      effAction: (role, key) => role === ADMIN_ROLE ? true : (policy.actions[`${role}|${key}`] ?? defAction(role, key)),
      effField: (role, key) => role === ADMIN_ROLE ? 'visible' : (policy.fields[`${role}|${key}`] ?? defField(role, key)),
      addRole: (name, level, desc, baseRole) => {
        // clone the base role's EFFECTIVE access as the new role's baseline
        const modules: Record<string, PermLevel> = {}
        const actions: Record<string, boolean> = {}
        const fields: Record<string, FieldLevel> = {}
        ALL_MODULES.forEach((m) => { modules[m.key] = policy.modules[`${baseRole}|${m.key}`] ?? defModule(baseRole, m.key) })
        ALL_ACTIONS.forEach((a) => { actions[a.key] = policy.actions[`${baseRole}|${a.key}`] ?? defAction(baseRole, a.key) })
        FIELDS.forEach((f) => { fields[f.key] = policy.fields[`${baseRole}|${f.key}`] ?? defField(baseRole, f.key) })
        setCustom((list) => [...list, { name, level, desc, modules, actions, fields }])
      },
      savePolicy: (next, items, reason, actor) => {
        setPolicy(next)
        setLog((l) => [{ id: `pl${l.length + 1}`, actor, at: 'just now', reason, items }, ...l])
      },
      resetPolicy: (reason, actor) => {
        setPolicy(EMPTY_POLICY)
        setLog((l) => [{ id: `pl${l.length + 1}`, actor, at: 'just now', reason, items: [{ kind: 'module', target: 'All roles', from: 'Custom', to: 'Default' }] }, ...l])
      },
    }
  }, [custom, policy, log])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRbac() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRbac must be used within RbacProvider')
  return ctx
}
