/**
 * Mock data for the SatelliteHR UX prototype.
 * Everything here is plain-language by design — see ux-research.md §3 (jargon layer).
 * Today is Wed, 10 June 2026.
 */

/* ───────────────────────────────────────────── personas (ux-research §2) */

export type PersonaId = 'employee' | 'manager' | 'hradmin' | 'portfolio' | 'operator'
export type NavKey =
  | 'home'
  | 'timeoff'
  | 'inbox'
  | 'people'
  | 'rules'
  | 'documents'
  | 'companies'
  | 'reports'

export type Persona = {
  id: PersonaId
  name: string
  title: string
  sub: string
  /** can switch companies (portfolio / operator) */
  multiCompany: boolean
  homeCompany: string
  nav: NavKey[]
  hue: number
}

export const PERSONAS: Persona[] = [
  {
    id: 'employee',
    name: 'Priya Nair',
    title: 'Product Designer',
    sub: 'Acme Tech',
    multiCompany: false,
    homeCompany: 'acme',
    nav: ['home', 'timeoff', 'people', 'documents'],
    hue: 0,
  },
  {
    id: 'manager',
    name: 'Arjun Mehta',
    title: 'Engineering Manager',
    sub: 'Acme Tech',
    multiCompany: false,
    homeCompany: 'acme',
    nav: ['home', 'inbox', 'timeoff', 'people', 'documents'],
    hue: 1,
  },
  {
    id: 'hradmin',
    name: 'Sara Iyer',
    title: 'HR Admin',
    sub: 'Acme Tech',
    multiCompany: false,
    homeCompany: 'acme',
    nav: ['home', 'people', 'timeoff', 'rules', 'documents', 'reports'],
    hue: 2,
  },
  {
    id: 'portfolio',
    name: 'David Chen',
    title: 'Portfolio Manager',
    sub: 'Helix Shared Services',
    multiCompany: true,
    homeCompany: 'acme',
    nav: ['home', 'companies', 'people', 'rules', 'reports'],
    hue: 3,
  },
  {
    id: 'operator',
    name: 'Maya Kapoor',
    title: 'Platform Operator',
    sub: 'SatelliteHR',
    multiCompany: true,
    homeCompany: 'acme',
    nav: ['home', 'companies', 'rules', 'reports'],
    hue: 4,
  },
]

/* ───────────────────────────────────────────── companies (Journey 1 + 2) */

export type CompanyStatus = 'Live' | 'Getting set up' | 'Paused'

export type Company = {
  id: string
  name: string
  short: string // 1-2 chars for the logo dot
  city: string
  employees: number
  status: CompanyStatus
  /** per-company accent — drives the workspace accent color (Journey 2) */
  accent: string
  since: string
  plan: 'Basic' | 'Standard' | 'Enterprise'
  setupProgress?: number // 0-100, when status = Getting set up
  inPortfolio: boolean // part of David's portfolio
  /** group-company affiliation (sister concerns etc.) — undefined = standalone */
  group?: string
}

export const COMPANIES: Company[] = [
  { id: 'acme', name: 'Acme Tech', short: 'A', city: 'Bengaluru', employees: 142, status: 'Live', accent: '#F0B940', since: 'Feb 2026', plan: 'Enterprise', inPortfolio: true },
  { id: 'beta', name: 'Beta Foods', short: 'B', city: 'Mumbai', employees: 86, status: 'Live', accent: '#E08A63', since: 'Mar 2026', plan: 'Standard', inPortfolio: true, group: 'Meridian Group' },
  { id: 'gamma', name: 'Gamma Retail', short: 'G', city: 'Delhi', employees: 47, status: 'Getting set up', accent: '#8FA876', since: 'May 2026', plan: 'Standard', setupProgress: 68, inPortfolio: true, group: 'Meridian Group' },
  { id: 'delta', name: 'Delta Health', short: 'D', city: 'Pune', employees: 210, status: 'Live', accent: '#6FA3A0', since: 'Jan 2026', plan: 'Enterprise', inPortfolio: false },
  { id: 'epsilon', name: 'Epsilon Studios', short: 'E', city: 'Goa', employees: 23, status: 'Paused', accent: '#B58BAE', since: 'Apr 2026', plan: 'Basic', inPortfolio: false },
]

/* ───────────────────────────────────────────── people */

export type Person = {
  id: string
  name: string
  role: string
  dept: 'Engineering' | 'Design' | 'People' | 'Sales' | 'Finance' | 'Leadership' | 'Operations'
  location: string
  email: string
  status: 'Active' | 'On leave' | 'Joining soon'
  managerId?: string
  hue: number
  /** which company employs them — employee records are always company-specific */
  companyId: string
}

export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Ananya Rao', role: 'Chief Executive', dept: 'Leadership', location: 'Bengaluru', email: 'ananya@acme.in', status: 'Active', hue: 0, companyId: 'acme' },
  { id: 'p2', name: 'Arjun Mehta', role: 'Engineering Manager', dept: 'Engineering', location: 'Bengaluru', email: 'arjun@acme.in', status: 'Active', managerId: 'p1', hue: 1, companyId: 'acme' },
  { id: 'p3', name: 'Sara Iyer', role: 'HR Admin', dept: 'People', location: 'Bengaluru', email: 'sara@acme.in', status: 'Active', managerId: 'p1', hue: 2, companyId: 'acme' },
  { id: 'p4', name: 'Vikram Shah', role: 'Sales Director', dept: 'Sales', location: 'Mumbai', email: 'vikram@acme.in', status: 'Active', managerId: 'p1', hue: 3, companyId: 'acme' },
  { id: 'p5', name: 'Priya Nair', role: 'Product Designer', dept: 'Design', location: 'Bengaluru', email: 'priya@acme.in', status: 'Active', managerId: 'p2', hue: 4, companyId: 'acme' },
  { id: 'p6', name: 'Rohan Gupta', role: 'Senior Engineer', dept: 'Engineering', location: 'Bengaluru', email: 'rohan@acme.in', status: 'Active', managerId: 'p2', hue: 5, companyId: 'acme' },
  { id: 'p7', name: 'Meera Pillai', role: 'Frontend Engineer', dept: 'Engineering', location: 'Remote', email: 'meera@acme.in', status: 'On leave', managerId: 'p2', hue: 0, companyId: 'acme' },
  { id: 'p8', name: 'Kabir Singh', role: 'Data Engineer', dept: 'Engineering', location: 'Hyderabad', email: 'kabir@acme.in', status: 'Active', managerId: 'p2', hue: 1, companyId: 'acme' },
  { id: 'p9', name: 'Tara Menon', role: 'People Partner', dept: 'People', location: 'Bengaluru', email: 'tara@acme.in', status: 'Active', managerId: 'p3', hue: 2, companyId: 'acme' },
  { id: 'p10', name: 'Dev Patel', role: 'Account Executive', dept: 'Sales', location: 'Mumbai', email: 'dev@acme.in', status: 'Active', managerId: 'p4', hue: 3, companyId: 'acme' },
  { id: 'p11', name: 'Isha Reddy', role: 'Finance Analyst', dept: 'Finance', location: 'Bengaluru', email: 'isha@acme.in', status: 'Active', managerId: 'p1', hue: 4, companyId: 'acme' },
  { id: 'p12', name: 'Nikhil Bose', role: 'QA Engineer', dept: 'Engineering', location: 'Bengaluru', email: 'nikhil@acme.in', status: 'Joining soon', managerId: 'p2', hue: 5, companyId: 'acme' },
  { id: 'p13', name: 'Farhan Ali', role: 'Plant Manager', dept: 'Operations', location: 'Mumbai', email: 'farhan@beta.in', status: 'Active', hue: 0, companyId: 'beta' },
  { id: 'p14', name: 'Lakshmi Iyer', role: 'Quality Lead', dept: 'Operations', location: 'Mumbai', email: 'lakshmi@beta.in', status: 'Active', managerId: 'p13', hue: 2, companyId: 'beta' },
  { id: 'p15', name: 'Joseph K', role: 'Finance Manager', dept: 'Finance', location: 'Mumbai', email: 'joseph@beta.in', status: 'Active', managerId: 'p13', hue: 3, companyId: 'beta' },
  { id: 'p16', name: 'Ritu Sharma', role: 'Store Operations', dept: 'Operations', location: 'Delhi', email: 'ritu@gamma.in', status: 'Active', hue: 4, companyId: 'gamma' },
  { id: 'p17', name: 'Manav Joshi', role: 'Head of Buying', dept: 'Sales', location: 'Delhi', email: 'manav@gamma.in', status: 'Active', managerId: 'p16', hue: 5, companyId: 'gamma' },
]

/* ───────────────────────────────────────────── time off (Journey 5) */

export type LeaveType = 'Casual' | 'Sick' | 'Earned'

export type LeaveBalance = { type: LeaveType; total: number; used: number; note: string }

export const MY_BALANCES: LeaveBalance[] = [
  { type: 'Casual', total: 8, used: 3, note: 'Resets in January' },
  { type: 'Sick', total: 10, used: 2, note: 'No doctor note under 3 days' },
  { type: 'Earned', total: 18, used: 6, note: 'Carries over up to 10' },
]

export type TimelineStep = { label: string; at?: string; done: boolean }

export type LeaveRequest = {
  id: string
  type: LeaveType
  from: string // '2026-06-18'
  to: string
  days: number
  note?: string
  status: 'Approved' | 'With your manager' | 'Declined'
  timeline: TimelineStep[]
}

export const MY_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr1',
    type: 'Earned',
    from: '2026-06-22',
    to: '2026-06-24',
    days: 3,
    note: 'Family trip',
    status: 'With your manager',
    timeline: [
      { label: 'Sent', at: 'Mon 9:14', done: true },
      { label: 'With Arjun (your manager)', done: false },
      { label: 'Confirmed', done: false },
    ],
  },
  {
    id: 'lr2',
    type: 'Sick',
    from: '2026-05-28',
    to: '2026-05-28',
    days: 1,
    status: 'Approved',
    timeline: [
      { label: 'Sent', at: '28 May 8:02', done: true },
      { label: 'Approved by Arjun', at: '28 May 8:31', done: true },
    ],
  },
]

/** June 2026 — 1st is a Monday. Pre-shading data for the calendar. */
export const HOLIDAYS: { date: number; label: string }[] = [
  { date: 17, label: 'Bakrid' },
  { date: 26, label: 'Founders Day' },
]
/** days where teammates are already off (conflict shading) */
export const TEAM_OFF: { date: number; who: string[] }[] = [
  { date: 12, who: ['Meera'] },
  { date: 15, who: ['Meera', 'Rohan'] },
  { date: 22, who: ['Kabir'] },
  { date: 23, who: ['Kabir'] },
]
export const TODAY = 10 // 10 June 2026, a Wednesday

/* ───────────────────────────────────────────── manager inbox (Journey 4) */

export type InboxKind = 'Time off' | 'Attendance fix' | 'Onboarding' | 'Job offer' | 'Probation'

export type InboxItem = {
  id: string
  kind: InboxKind
  who: string
  whoHue: number
  whoRole: string
  title: string
  /** the 3 facts needed to decide from the card (ux-research §4 J4) */
  facts: string[]
  due: string // 'due in 4h'
  dueTone: 'red' | 'amber' | 'neutral'
  /** flagged low-risk: within balance, no conflicts → eligible for bulk approve */
  safe: boolean
  status: 'waiting' | 'approved' | 'declined'
}

export const INBOX: InboxItem[] = [
  {
    id: 'in1', kind: 'Time off', who: 'Priya Nair', whoHue: 4, whoRole: 'Product Designer',
    title: '3 days earned leave · 22–24 Jun',
    facts: ['Has 12 days left', 'Kabir is also off 22–23', 'First request this quarter'],
    due: 'due in 4h', dueTone: 'red', safe: false, status: 'waiting',
  },
  {
    id: 'in2', kind: 'Time off', who: 'Rohan Gupta', whoHue: 5, whoRole: 'Senior Engineer',
    title: '1 day casual leave · Fri 13 Jun',
    facts: ['Has 6 days left', 'No team conflicts', 'No deadlines that day'],
    due: 'due in 9h', dueTone: 'amber', safe: true, status: 'waiting',
  },
  {
    id: 'in3', kind: 'Attendance fix', who: 'Meera Pillai', whoHue: 0, whoRole: 'Frontend Engineer',
    title: 'Missed punch-out · Tue 9 Jun',
    facts: ['Logged off 6:42 pm in VPN records', 'First fix this month', 'Auto-checked against system logs'],
    due: 'due tomorrow', dueTone: 'neutral', safe: true, status: 'waiting',
  },
  {
    id: 'in4', kind: 'Onboarding', who: 'Nikhil Bose', whoHue: 5, whoRole: 'QA Engineer · joins 16 Jun',
    title: 'Confirm laptop + access for day one',
    facts: ['MacBook reserved', 'Email created', 'Needs your sign-off to ship'],
    due: 'due in 2d', dueTone: 'neutral', safe: true, status: 'waiting',
  },
  {
    id: 'in5', kind: 'Job offer', who: 'Sana Qureshi', whoHue: 2, whoRole: 'Candidate · Senior QA',
    title: 'Offer of ₹28L — needs your approval',
    facts: ['Within band for the role', 'Panel score 4.5 / 5', 'Two competing offers'],
    due: 'due in 6h', dueTone: 'amber', safe: false, status: 'waiting',
  },
  {
    id: 'in6', kind: 'Probation', who: 'Kabir Singh', whoHue: 1, whoRole: 'Data Engineer',
    title: 'Probation review — confirm or extend',
    facts: ['Joined 10 Mar', 'Goals: 3 of 3 met', 'Peer feedback positive'],
    due: 'due in 3d', dueTone: 'neutral', safe: true, status: 'waiting',
  },
]

/* ───────────────────────────────────────────── rules & flows (Journey 3) */

export type RuleStatus = 'Running' | 'Draft' | 'Waiting for approval' | 'Paused'

/**
 * The enforcement chain (docs/policy-enforcement-model.md): a rule LIVES at one
 * level and LANDS on every company in scope below — live, never copied.
 */
export type RuleLevel = 'Platform' | 'Portfolio' | 'Company'
/** what children may do with a parent rule */
export type ChildControl = 'locked' | 'adjustable' | 'optional'
/** one entry in the change audit — who · what · when */
export type RuleEvent = { who: string; what: string; when: string }

export type Rule = {
  id: string
  name: string
  category: 'Time off' | 'Attendance' | 'Documents' | 'Onboarding'
  status: RuleStatus
  /** where the rule lives — who controls it */
  level: RuleLevel
  /** owning company when level === 'Company' */
  ownerCompanyId?: string
  /** posture toward descendants (meaningful when level !== 'Company') */
  childControl: ChildControl
  /** sentence-builder chunks: "Applies to {who} in {where} in {team}" */
  appliesTo: { who: string; where: string; team: string }
  headcount: number
  /** approval pipeline, in order */
  chain: string[]
  notify: string[]
  /** plain-language precedence outcome (never make users compute it) */
  shadowedBy?: string
  updated: string
  /** append-only change audit, newest last */
  history: RuleEvent[]
}

/** live blast radius: which companies a rule lands on, and roughly how many people */
export function reachFor(
  rule: Pick<Rule, 'level' | 'ownerCompanyId' | 'headcount'>,
  companies: { id: string; employees: number; inPortfolio: boolean }[],
): { companies: number; people: number } {
  const inScope =
    rule.level === 'Platform'
      ? companies
      : rule.level === 'Portfolio'
        ? companies.filter((c) => c.inPortfolio)
        : companies.filter((c) => c.id === (rule.ownerCompanyId ?? 'acme'))
  const people = Math.round(inScope.reduce((n, c) => n + c.employees, 0) * (rule.headcount / 142))
  return { companies: inScope.length, people: Math.max(1, people) }
}

export const RULES: Rule[] = [
  {
    id: 'r8', name: 'Respect at work (POSH)', category: 'Documents', status: 'Running',
    level: 'Platform', childControl: 'locked',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['HR'], notify: ['Person', 'HR'], updated: '4mo ago',
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '8 Jan' },
      { who: 'Legal council', what: 'Approved', when: '10 Jan' },
      { who: 'SatelliteHR', what: 'Enforced in 3 companies · 251 people', when: '10 Jan' },
      { who: 'SatelliteHR', what: 'Delta Health joined — inherited automatically', when: '20 Jan' },
      { who: 'SatelliteHR', what: 'Gamma Retail joined — inherited automatically', when: '12 May' },
    ],
  },
  {
    id: 'r4', name: 'Global data protection', category: 'Documents', status: 'Running',
    level: 'Platform', childControl: 'locked',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Legal council'], notify: ['Person', 'HR'], updated: '1mo ago',
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '12 Jan' },
      { who: 'Legal council', what: 'Approved', when: '14 Jan' },
      { who: 'SatelliteHR', what: 'Enforced everywhere · 508 people', when: '14 Jan' },
      { who: 'Maya Kapoor', what: 'Changed: added AI-tools clause (re-approved)', when: '2 May' },
      { who: 'SatelliteHR', what: 'Gamma Retail joined — inherited automatically', when: '12 May' },
    ],
  },
  {
    id: 'r6', name: 'Festive bonus letters', category: 'Documents', status: 'Draft',
    level: 'Portfolio', childControl: 'adjustable',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Finance', 'HR'], notify: ['Person'], updated: 'today',
    history: [{ who: 'David Chen', what: 'Drafted for the portfolio', when: 'today' }],
  },
  {
    id: 'r1', name: 'Casual & sick leave', category: 'Time off', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Manager'], notify: ['Person', 'Manager'], updated: '2w ago',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '20 Feb' },
      { who: 'Ananya Rao', what: 'Approved', when: '21 Feb' },
      { who: 'SatelliteHR', what: 'Running · 142 people', when: '21 Feb' },
    ],
  },
  {
    id: 'r2', name: 'Earned leave (3+ days)', category: 'Time off', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Manager', 'HR'], notify: ['Person', 'Manager', 'HR'], updated: '2w ago',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '20 Feb' },
      { who: 'Ananya Rao', what: 'Approved', when: '22 Feb' },
      { who: 'SatelliteHR', what: 'Running · 142 people', when: '22 Feb' },
    ],
  },
  {
    id: 'r3', name: 'Work from anywhere', category: 'Attendance', status: 'Waiting for approval',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'Bengaluru', team: 'Engineering' },
    headcount: 64, chain: ['Dept head', 'HR'], notify: ['Person', 'Manager'], updated: 'yesterday',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: 'Mon' },
      { who: 'Sara Iyer', what: 'Sent for approval', when: 'yesterday' },
    ],
  },
  {
    id: 'r7', name: 'Data handling (Acme addendum)', category: 'Documents', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: [], notify: ['Person', 'HR'],
    shadowedBy: 'Global data protection — set at platform level', updated: '1mo ago',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '2 Mar' },
      { who: 'SatelliteHR', what: 'Shadowed by Global data protection (platform wins)', when: '2 Mar' },
    ],
  },
  {
    id: 'r5', name: 'Day-one equipment checklist', category: 'Onboarding', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'new joiners', where: 'everywhere', team: 'every team' },
    headcount: 3, chain: ['Manager', 'IT'], notify: ['Manager', 'IT'], updated: '3w ago',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '1 Mar' },
      { who: 'SatelliteHR', what: 'Running · every new joiner', when: '1 Mar' },
    ],
  },
]

export const APPROVER_OPTIONS = ['Manager', 'Dept head', 'HR', 'Finance', 'IT'] as const
export const WHO_OPTIONS = ['all employees', 'new joiners', 'managers only', 'contract staff'] as const
export const WHERE_OPTIONS = ['everywhere', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Remote'] as const
export const TEAM_OPTIONS = ['every team', 'Engineering', 'Design', 'Sales', 'People', 'Finance'] as const

/** live headcount the sentence resolves to — keeps the abstraction concrete */
export function headcountFor(who: string, where: string, team: string): number {
  let n = 142
  if (who === 'new joiners') n = 3
  if (who === 'managers only') n = 11
  if (who === 'contract staff') n = 9
  if (where !== 'everywhere') n = Math.round(n * (where === 'Bengaluru' ? 0.69 : where === 'Mumbai' ? 0.18 : 0.09))
  if (team !== 'every team') n = Math.round(n * (team === 'Engineering' ? 0.45 : team === 'Sales' ? 0.2 : 0.12))
  return Math.max(1, n)
}

/* ───────────────────────────────────────────── documents & acknowledgments */

export type AckDoc = {
  id: string
  title: string
  required: boolean
  due: string
  minutes: number
  summary: string
  state: 'todo' | 'done'
}

export const ACK_DOCS: AckDoc[] = [
  { id: 'd1', title: 'Code of conduct 2026', required: true, due: 'by 20 Jun', minutes: 4, summary: 'How we treat each other, customers, and partners. Updated section on AI tool use.', state: 'todo' },
  { id: 'd2', title: 'Work from anywhere guide', required: false, due: 'no deadline', minutes: 3, summary: 'When and how to work remotely, and how to book a desk when you return.', state: 'todo' },
  { id: 'd3', title: 'Data protection basics', required: true, due: 'done 2 Jun', minutes: 5, summary: 'Keeping customer and employee data safe. Required for everyone, every year.', state: 'done' },
]

export type Letter = { id: string; title: string; kind: string; date: string }

export const MY_LETTERS: Letter[] = [
  { id: 'l1', title: 'Appointment letter', kind: 'PDF', date: 'Feb 2026' },
  { id: 'l2', title: 'Confirmation letter', kind: 'PDF', date: 'May 2026' },
]

/* ───────────────────────────────────────────── add-a-company (Journey 1) */

export type Template = {
  id: string
  name: string
  desc: string
  tags: string[]
  /** what gets pre-filled — show counts, it sells the shortcut */
  prefills: { label: string; count: number }[]
}

export const TEMPLATES: Template[] = [
  {
    id: 't1', name: 'Indian IT services', desc: 'Shift-friendly calendars, earned-leave policy, festival holidays.',
    tags: ['Most used'],
    prefills: [
      { label: 'time-off rules', count: 5 },
      { label: 'approval flows', count: 4 },
      { label: 'holiday calendar', count: 1 },
      { label: 'letter templates', count: 6 },
    ],
  },
  {
    id: 't2', name: 'Manufacturing', desc: 'Plant shifts, overtime rules, safety acknowledgments built in.',
    tags: [],
    prefills: [
      { label: 'time-off rules', count: 4 },
      { label: 'shift patterns', count: 3 },
      { label: 'safety documents', count: 2 },
      { label: 'letter templates', count: 5 },
    ],
  },
  {
    id: 't3', name: 'Retail & stores', desc: 'Store rosters, weekend trading, seasonal staffing patterns.',
    tags: [],
    prefills: [
      { label: 'time-off rules', count: 3 },
      { label: 'roster patterns', count: 4 },
      { label: 'approval flows', count: 3 },
      { label: 'letter templates', count: 4 },
    ],
  },
  {
    id: 'clone-acme', name: 'Copy of Acme Tech', desc: 'Everything Acme has — policies, flows, calendars — minus the people.',
    tags: ['Clone'],
    prefills: [
      { label: 'time-off rules', count: 6 },
      { label: 'approval flows', count: 5 },
      { label: 'holiday calendars', count: 2 },
      { label: 'letter templates', count: 8 },
    ],
  },
]

export type SetupPhase = { title: string; steps: string[] }

export const SETUP_PHASES: SetupPhase[] = [
  { title: 'Foundation', steps: ['Company profile', 'Locations', 'Teams & roles'] },
  { title: 'How things run', steps: ['Time off & holidays', 'Approval flows'] },
  { title: 'Bring people in', steps: ['Add people', 'Go live'] },
]

/** pre-flight checks for the Go-live step — green-light energy, not red flags */
export type PreflightCheck = { label: string; ok: boolean; fix?: string }
