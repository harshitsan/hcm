/**
 * Starting points for the wizard. Picking one seeds the entire SetupState; the
 * operator then adjusts. Four prebuilt templates plus a clone-from-existing option
 * derived from the live `companies` list.
 */
import { Building2, Factory, Store, Rocket, Copy, type LucideIcon } from 'lucide-react'
import { companies } from '../../data/mock'
import {
  blankState, rid,
  type SetupState, type AccessRow, type LeaveType, type DocTemplate, type Workflow,
} from './model'

export type SetupTemplate = {
  id: string
  name: string
  tagline: string
  icon: LucideIcon
  meta: string
  kind: 'template' | 'clone' | 'blank'
  build: () => SetupState
}

/* ----------------------------------------------------------------- shared builders */
const standardAccess = (): AccessRow[] => [
  { id: rid('ac'), role: 'Company HR Admin', scope: 'Company', assignees: 'HR team (1)' },
  { id: rid('ac'), role: 'People Manager', scope: 'Department', assignees: 'Dept heads' },
  { id: rid('ac'), role: 'Employee', scope: 'Self-service', assignees: 'All staff' },
  { id: rid('ac'), role: 'Portfolio Manager', scope: 'Portfolio', assignees: 'Group HR' },
]

const standardLeave = (): LeaveType[] => [
  { id: rid('lv'), name: 'Casual Leave', days: 12, accrual: 'Monthly', carryForward: 0, applicability: 'Company' },
  { id: rid('lv'), name: 'Sick Leave', days: 8, accrual: 'Monthly', carryForward: 0, applicability: 'Company' },
  { id: rid('lv'), name: 'Earned Leave', days: 18, accrual: 'Monthly', carryForward: 30, applicability: 'Company' },
  { id: rid('lv'), name: 'Maternity Leave', days: 182, accrual: 'Annual', carryForward: 0, applicability: 'Employment type' },
]

const standardTemplates = (): DocTemplate[] => [
  { id: rid('tp'), name: 'Offer Letter', kind: 'Letter', channel: 'PDF + Email' },
  { id: rid('tp'), name: 'Appointment Letter', kind: 'Letter', channel: 'PDF + Email' },
  { id: rid('tp'), name: 'Confirmation Letter', kind: 'Letter', channel: 'PDF + Email' },
  { id: rid('tp'), name: 'Relieving Letter', kind: 'Letter', channel: 'PDF + Email' },
  { id: rid('tp'), name: 'Leave Approved', kind: 'Notification', channel: 'Email + In-app' },
  { id: rid('tp'), name: 'Onboarding Reminder', kind: 'Notification', channel: 'Email + In-app' },
]

const standardWorkflows = (): Workflow[] => [
  { id: rid('wf'), name: 'Leave approval', trigger: 'Leave', chain: 'Manager → HR', sla: '24h', escalation: 'HR Head after 48h' },
  { id: rid('wf'), name: 'Onboarding', trigger: 'Onboarding', chain: 'HR → IT → Manager', sla: '3 days', escalation: 'HR Head' },
  { id: rid('wf'), name: 'Exit clearance', trigger: 'Exit', chain: 'Manager → IT → Finance → HR', sla: '5 days', escalation: 'HR Head' },
  { id: rid('wf'), name: 'Attendance regularization', trigger: 'Regularization', chain: 'Manager', sla: '24h', escalation: 'HR after 72h' },
]

const standardHolidays = () => [
  { id: rid('hl'), name: 'Republic Day', date: '2026-01-26', kind: 'Public' as const },
  { id: rid('hl'), name: 'Holi', date: '2026-03-04', kind: 'Restricted' as const },
  { id: rid('hl'), name: 'Independence Day', date: '2026-08-15', kind: 'Public' as const },
  { id: rid('hl'), name: 'Diwali', date: '2026-11-08', kind: 'Public' as const },
]

const merge = (over: Partial<SetupState>, id: string): SetupState => ({
  ...blankState,
  ...over,
  templateId: id,
})

/* ----------------------------------------------------------------- IT Services (default) */
function buildITServices(id = 'it'): SetupState {
  return merge(
    {
      jurisdictions: ['Telangana', 'Karnataka'],
      locations: [
        { id: rid('lo'), name: 'Head Office', kind: 'HQ', city: 'Hyderabad', state: 'Telangana', headcount: 180 },
        { id: rid('lo'), name: 'Bengaluru Dev Centre', kind: 'Branch', city: 'Bengaluru', state: 'Karnataka', headcount: 90 },
        { id: rid('lo'), name: 'Remote (India)', kind: 'Remote', city: '—', state: '—', headcount: 42 },
      ],
      departments: [
        { id: rid('de'), name: 'Engineering', head: 'Rahul Verma', parent: '—' },
        { id: rid('de'), name: 'Product', head: 'Sneha Kapoor', parent: '—' },
        { id: rid('de'), name: 'Sales', head: 'Arjun Desai', parent: '—' },
        { id: rid('de'), name: 'Human Resources', head: 'Priya Sharma', parent: '—' },
        { id: rid('de'), name: 'Finance', head: 'Karan Mehta', parent: '—' },
      ],
      positions: [
        { id: rid('po'), title: 'Software Engineer', dept: 'Engineering', band: 'B2' },
        { id: rid('po'), title: 'Senior Engineer', dept: 'Engineering', band: 'B3' },
        { id: rid('po'), title: 'Product Manager', dept: 'Product', band: 'B3' },
        { id: rid('po'), title: 'Account Executive', dept: 'Sales', band: 'B2' },
      ],
      groups: [
        { id: rid('gr'), name: 'Platform Squad', kind: 'Project', members: 14 },
        { id: rid('gr'), name: 'Leadership', kind: 'Function', members: 8 },
      ],
      holidays: standardHolidays(),
      shifts: [
        { id: rid('sh'), name: 'General', start: '09:30', end: '18:30', days: 'Mon–Fri' },
        { id: rid('sh'), name: 'Support (US overlap)', start: '14:00', end: '23:00', days: 'Mon–Fri' },
      ],
      customFields: [
        { id: rid('cf'), label: 'GitHub handle', entity: 'Employee', type: 'Text', required: false },
        { id: rid('cf'), label: 'Cost centre', entity: 'Department', type: 'Text', required: true },
      ],
      access: standardAccess(),
      leaveTypes: standardLeave(),
      attendanceRules: [
        { id: rid('at'), name: 'Grace period', value: '15 min', applicability: 'Company' },
        { id: rid('at'), name: 'Regularization window', value: '7 days', applicability: 'Company' },
        { id: rid('at'), name: 'Remote auto check-in', value: 'Enabled', applicability: 'Group' },
      ],
      workflows: standardWorkflows(),
      templates: standardTemplates(),
      assetCategories: [
        { id: rid('as'), name: 'Laptop', tracked: true, depreciation: '3 yrs SLM' },
        { id: rid('as'), name: 'Access card', tracked: true, depreciation: '—' },
        { id: rid('as'), name: 'Monitor', tracked: true, depreciation: '4 yrs SLM' },
      ],
      people: [
        { id: rid('pe'), name: 'Rahul Verma', email: 'rahul@company.com', dept: 'Engineering', position: 'Senior Engineer', manager: '—', location: 'Head Office' },
        { id: rid('pe'), name: 'Sneha Kapoor', email: 'sneha@company.com', dept: 'Product', position: 'Product Manager', manager: '—', location: 'Head Office' },
        { id: rid('pe'), name: 'Aditya Rao', email: 'aditya@company.com', dept: 'Engineering', position: 'Software Engineer', manager: 'Rahul Verma', location: 'Bengaluru Dev Centre' },
      ],
      distributePolicies: ['Code of Conduct', 'Leave Policy', 'IT Acceptable Use'],
    },
    id,
  )
}

/* ----------------------------------------------------------------- Manufacturing */
function buildManufacturing(): SetupState {
  return merge(
    {
      jurisdictions: ['Maharashtra', 'Gujarat'],
      locations: [
        { id: rid('lo'), name: 'Corporate Office', kind: 'HQ', city: 'Pune', state: 'Maharashtra', headcount: 60 },
        { id: rid('lo'), name: 'Plant 1 — Chakan', kind: 'Plant', city: 'Chakan', state: 'Maharashtra', headcount: 420 },
        { id: rid('lo'), name: 'Plant 2 — Sanand', kind: 'Plant', city: 'Sanand', state: 'Gujarat', headcount: 280 },
      ],
      departments: [
        { id: rid('de'), name: 'Production', head: 'Suresh Patil', parent: '—' },
        { id: rid('de'), name: 'Quality', head: 'Meena Joshi', parent: '—' },
        { id: rid('de'), name: 'Maintenance', head: 'Imran Shaikh', parent: '—' },
        { id: rid('de'), name: 'Supply Chain', head: 'Anil Kumar', parent: '—' },
        { id: rid('de'), name: 'Human Resources', head: 'Priya Sharma', parent: '—' },
      ],
      positions: [
        { id: rid('po'), title: 'Line Operator', dept: 'Production', band: 'W2' },
        { id: rid('po'), title: 'Shift Supervisor', dept: 'Production', band: 'S1' },
        { id: rid('po'), title: 'QA Inspector', dept: 'Quality', band: 'S1' },
        { id: rid('po'), title: 'Maintenance Tech', dept: 'Maintenance', band: 'W3' },
      ],
      groups: [
        { id: rid('gr'), name: 'Plant 1 — Shift A', kind: 'Location', members: 140 },
        { id: rid('gr'), name: 'Plant 1 — Shift B', kind: 'Location', members: 140 },
        { id: rid('gr'), name: 'Safety Committee', kind: 'Function', members: 12 },
      ],
      holidays: standardHolidays(),
      shifts: [
        { id: rid('sh'), name: 'Shift A', start: '06:00', end: '14:00', days: 'Mon–Sat' },
        { id: rid('sh'), name: 'Shift B', start: '14:00', end: '22:00', days: 'Mon–Sat' },
        { id: rid('sh'), name: 'Shift C', start: '22:00', end: '06:00', days: 'Mon–Sat' },
      ],
      customFields: [
        { id: rid('cf'), label: 'ESIC number', entity: 'Employee', type: 'Text', required: true },
        { id: rid('cf'), label: 'Skill grade', entity: 'Employee', type: 'Select', required: true },
      ],
      access: standardAccess(),
      leaveTypes: [
        ...standardLeave(),
        { id: rid('lv'), name: 'Compensatory Off', days: 0, accrual: 'Monthly', carryForward: 6, applicability: 'Employment type' },
      ],
      attendanceRules: [
        { id: rid('at'), name: 'Biometric required', value: 'Enabled', applicability: 'Location' },
        { id: rid('at'), name: 'Overtime threshold', value: '9h / day', applicability: 'Company' },
        { id: rid('at'), name: 'Grace period', value: '5 min', applicability: 'Company' },
      ],
      workflows: standardWorkflows(),
      templates: standardTemplates(),
      assetCategories: [
        { id: rid('as'), name: 'PPE kit', tracked: true, depreciation: '1 yr' },
        { id: rid('as'), name: 'Machinery', tracked: true, depreciation: '10 yrs WDV' },
        { id: rid('as'), name: 'Tools', tracked: true, depreciation: '5 yrs SLM' },
      ],
      people: [
        { id: rid('pe'), name: 'Suresh Patil', email: 'suresh@company.com', dept: 'Production', position: 'Shift Supervisor', manager: '—', location: 'Plant 1 — Chakan' },
        { id: rid('pe'), name: 'Meena Joshi', email: 'meena@company.com', dept: 'Quality', position: 'QA Inspector', manager: '—', location: 'Plant 1 — Chakan' },
      ],
      distributePolicies: ['Code of Conduct', 'Leave Policy', 'Safety & PPE Policy', 'Shift Policy'],
    },
    'mfg',
  )
}

/* ----------------------------------------------------------------- Retail / Multi-store */
function buildRetail(): SetupState {
  return merge(
    {
      jurisdictions: ['Maharashtra', 'Karnataka', 'Delhi'],
      locations: [
        { id: rid('lo'), name: 'Support Office', kind: 'HQ', city: 'Mumbai', state: 'Maharashtra', headcount: 40 },
        { id: rid('lo'), name: 'Store — Phoenix', kind: 'Store', city: 'Mumbai', state: 'Maharashtra', headcount: 26 },
        { id: rid('lo'), name: 'Store — Forum', kind: 'Store', city: 'Bengaluru', state: 'Karnataka', headcount: 22 },
        { id: rid('lo'), name: 'Store — Select City', kind: 'Store', city: 'New Delhi', state: 'Delhi', headcount: 24 },
      ],
      departments: [
        { id: rid('de'), name: 'Retail Operations', head: 'Neha Gupta', parent: '—' },
        { id: rid('de'), name: 'Visual Merchandising', head: 'Rohit Sen', parent: '—' },
        { id: rid('de'), name: 'Supply Chain', head: 'Anil Kumar', parent: '—' },
        { id: rid('de'), name: 'Human Resources', head: 'Priya Sharma', parent: '—' },
      ],
      positions: [
        { id: rid('po'), title: 'Sales Associate', dept: 'Retail Operations', band: 'R1' },
        { id: rid('po'), title: 'Store Manager', dept: 'Retail Operations', band: 'R3' },
        { id: rid('po'), title: 'Cashier', dept: 'Retail Operations', band: 'R1' },
        { id: rid('po'), title: 'Merchandiser', dept: 'Visual Merchandising', band: 'R2' },
      ],
      groups: [
        { id: rid('gr'), name: 'West Region', kind: 'Location', members: 70 },
        { id: rid('gr'), name: 'Store Managers', kind: 'Function', members: 12 },
      ],
      holidays: standardHolidays(),
      shifts: [
        { id: rid('sh'), name: 'Morning', start: '10:00', end: '18:00', days: 'Mon–Sun' },
        { id: rid('sh'), name: 'Evening', start: '14:00', end: '22:00', days: 'Mon–Sun' },
      ],
      customFields: [
        { id: rid('cf'), label: 'Store code', entity: 'Employee', type: 'Text', required: true },
        { id: rid('cf'), label: 'Sales target', entity: 'Employee', type: 'Number', required: false },
      ],
      access: standardAccess(),
      leaveTypes: standardLeave(),
      attendanceRules: [
        { id: rid('at'), name: 'Store roster sign-in', value: 'Enabled', applicability: 'Location' },
        { id: rid('at'), name: 'Weekly off', value: 'Rotational', applicability: 'Group' },
        { id: rid('at'), name: 'Grace period', value: '10 min', applicability: 'Company' },
      ],
      workflows: standardWorkflows(),
      templates: standardTemplates(),
      assetCategories: [
        { id: rid('as'), name: 'POS terminal', tracked: true, depreciation: '5 yrs SLM' },
        { id: rid('as'), name: 'Uniform', tracked: false, depreciation: '—' },
      ],
      people: [
        { id: rid('pe'), name: 'Neha Gupta', email: 'neha@company.com', dept: 'Retail Operations', position: 'Store Manager', manager: '—', location: 'Store — Phoenix' },
        { id: rid('pe'), name: 'Rohit Sen', email: 'rohit@company.com', dept: 'Visual Merchandising', position: 'Merchandiser', manager: '—', location: 'Support Office' },
      ],
      distributePolicies: ['Code of Conduct', 'Leave Policy', 'Store Cash Handling', 'Uniform Policy'],
    },
    'retail',
  )
}

/* ----------------------------------------------------------------- Lean Startup */
function buildStartup(): SetupState {
  return merge(
    {
      jurisdictions: ['Karnataka'],
      locations: [{ id: rid('lo'), name: 'Office', kind: 'HQ', city: 'Bengaluru', state: 'Karnataka', headcount: 18 }],
      departments: [
        { id: rid('de'), name: 'Engineering', head: 'Founder', parent: '—' },
        { id: rid('de'), name: 'Growth', head: 'Founder', parent: '—' },
        { id: rid('de'), name: 'Operations', head: 'Founder', parent: '—' },
      ],
      positions: [
        { id: rid('po'), title: 'Founding Engineer', dept: 'Engineering', band: '—' },
        { id: rid('po'), title: 'Growth Lead', dept: 'Growth', band: '—' },
      ],
      groups: [{ id: rid('gr'), name: 'Everyone', kind: 'Function', members: 18 }],
      holidays: standardHolidays(),
      shifts: [{ id: rid('sh'), name: 'Flexible', start: '10:00', end: '19:00', days: 'Mon–Fri' }],
      customFields: [{ id: rid('cf'), label: 'Equity grant', entity: 'Employee', type: 'Text', required: false }],
      access: standardAccess(),
      leaveTypes: [
        { id: rid('lv'), name: 'Paid Time Off', days: 24, accrual: 'Annual', carryForward: 6, applicability: 'Company' },
        { id: rid('lv'), name: 'Sick Leave', days: 8, accrual: 'Annual', carryForward: 0, applicability: 'Company' },
      ],
      attendanceRules: [{ id: rid('at'), name: 'Honour-based attendance', value: 'Enabled', applicability: 'Company' }],
      workflows: [
        { id: rid('wf'), name: 'Leave approval', trigger: 'Leave', chain: 'Founder', sla: '24h', escalation: '—' },
        { id: rid('wf'), name: 'Onboarding', trigger: 'Onboarding', chain: 'Ops → Founder', sla: '2 days', escalation: '—' },
      ],
      templates: [
        { id: rid('tp'), name: 'Offer Letter', kind: 'Letter', channel: 'PDF + Email' },
        { id: rid('tp'), name: 'Welcome Note', kind: 'Notification', channel: 'Email' },
      ],
      assetCategories: [{ id: rid('as'), name: 'Laptop', tracked: true, depreciation: '3 yrs SLM' }],
      people: [{ id: rid('pe'), name: 'Founder', email: 'founder@company.com', dept: 'Engineering', position: 'Founding Engineer', manager: '—', location: 'Office' }],
      distributePolicies: ['Code of Conduct', 'PTO Policy'],
    },
    'startup',
  )
}

/* ----------------------------------------------------------------- the catalog */
export const TEMPLATES: SetupTemplate[] = [
  { id: 'it', name: 'Indian IT Services', tagline: 'Multi-city dev centres, hybrid work, standard leave & onboarding flows.', icon: Building2, meta: '5 depts · 4 leave types · 4 workflows', kind: 'template', build: () => buildITServices() },
  { id: 'mfg', name: 'Manufacturing & Plants', tagline: 'Plant locations, 3-shift rosters, biometric attendance, PPE assets.', icon: Factory, meta: '5 depts · 3 shifts · biometric rules', kind: 'template', build: buildManufacturing },
  { id: 'retail', name: 'Retail / Multi-store', tagline: 'Many stores, rotational shifts, store-level groups & rosters.', icon: Store, meta: '4 stores · roster sign-in · POS assets', kind: 'template', build: buildRetail },
  { id: 'startup', name: 'Lean Startup', tagline: 'Flat org, single office, minimal policies — ready in minutes.', icon: Rocket, meta: '3 depts · PTO · honour attendance', kind: 'template', build: buildStartup },
]

/** Clone an existing company's shape as a starting point (maps to a base payload). */
export const CLONE_SOURCES: SetupTemplate[] = companies
  .filter((c) => c.status === 'Active')
  .slice(0, 4)
  .map((c) => ({
    id: `clone:${c.id}`,
    name: `Clone of ${c.name}`,
    tagline: `Copy structure, policies & workflows from ${c.name} (${c.jurisdiction}).`,
    icon: Copy,
    meta: `${c.employees} employees · ${c.tier}`,
    kind: 'clone' as const,
    build: () => {
      const base = buildITServices(`clone:${c.id}`)
      const [region, state] = c.jurisdiction.split('·').map((s) => s.trim())
      return {
        ...base,
        legalName: c.name,
        tradeName: c.name.replace(/\s+(Pvt Ltd|LLC|Inc)\.?$/i, ''),
        jurisdictions: state ? [state] : base.jurisdictions,
        currency: region === 'United States' ? 'USD — US Dollar' : region === 'Sri Lanka' ? 'LKR — Sri Lankan Rupee' : 'INR — Indian Rupee',
      }
    },
  }))

export const blankTemplate: SetupTemplate = {
  id: 'blank',
  name: 'Start blank',
  tagline: 'Empty setup — the guided wizard walks you through every step from scratch.',
  icon: Building2,
  meta: 'No pre-filled data',
  kind: 'blank',
  build: () => ({ ...blankState, templateId: 'blank' }),
}
