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
  | 'hiring'
  | 'access'
  | 'activity'
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
    nav: ['home', 'inbox', 'timeoff', 'hiring', 'people', 'documents'],
    hue: 1,
  },
  {
    id: 'hradmin',
    name: 'Sara Iyer',
    title: 'HR Admin',
    sub: 'Acme Tech',
    multiCompany: false,
    homeCompany: 'acme',
    nav: ['home', 'people', 'hiring', 'timeoff', 'rules', 'access', 'documents', 'activity', 'reports'],
    hue: 2,
  },
  {
    id: 'portfolio',
    name: 'David Chen',
    title: 'Portfolio Manager',
    sub: 'Helix Shared Services',
    multiCompany: true,
    homeCompany: 'acme',
    nav: ['home', 'companies', 'people', 'rules', 'activity', 'reports'],
    hue: 3,
  },
  {
    id: 'operator',
    name: 'Maya Kapoor',
    title: 'Platform Operator',
    sub: 'SatelliteHR',
    multiCompany: true,
    homeCompany: 'acme',
    nav: ['home', 'companies', 'rules', 'access', 'activity', 'reports'],
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

export type InboxKind = 'Time off' | 'Attendance fix' | 'Onboarding' | 'Job offer' | 'Probation' | 'Report'

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
  /** set when a RULE created this ticket automatically */
  source?: string
}

export const INBOX: InboxItem[] = [
  {
    id: 'in7', kind: 'Attendance fix', who: 'Kabir Singh', whoHue: 1, whoRole: 'Data Engineer',
    title: 'Half day proposed — 3rd late check-in this month',
    facts: ['Checked in 9:07, 9:08, 9:06', 'Rule fired automatically', 'HR decides — nothing applied yet'],
    due: 'due in 1d', dueTone: 'amber', safe: false, status: 'waiting',
    source: 'Late check-in → half day',
  },
  {
    id: 'in8', kind: 'Probation', who: 'Dev Patel', whoHue: 3, whoRole: 'Account Executive',
    title: 'Day 3, no contact — please try to reach him',
    facts: ['Absent Mon–Wed, phone off', 'Step 1 of the absconding playbook', 'Day 5: HR ticket + letter, automatically'],
    due: 'due today', dueTone: 'red', safe: false, status: 'waiting',
    source: 'When someone absconds',
  },
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
export type ChainResolution = 'local' | 'central'

/** who actually wears each approver hat, per company — undefined = nobody yet */
export const ROLE_HOLDERS: Record<string, Record<string, string | undefined>> = {
  acme: { Manager: 'Arjun Mehta', 'Dept head': 'Vikram Shah', HR: 'Sara Iyer', Finance: 'Isha Reddy', IT: 'Rohan Gupta', 'Chief executive': 'Ananya Rao' },
  beta: { Manager: 'Farhan Ali', 'Dept head': 'Farhan Ali', HR: 'Lakshmi Iyer', Finance: 'Joseph K' },
  gamma: { Manager: 'Ritu Sharma', 'Dept head': 'Ritu Sharma' }, // mid-setup: no HR or Finance yet
  delta: { Manager: 'Team leads', 'Dept head': 'Dept heads', HR: 'Their HR desk', Finance: 'Their finance desk', IT: 'Their IT desk', 'Chief executive': 'Their CEO' },
  epsilon: {},
}

export function holderFor(companyId: string, role: string): string | undefined {
  return ROLE_HOLDERS[companyId]?.[role]
}

/** when resolution is 'central', the owner level's own team decides */
export function centralTeamLabel(level: RuleLevel): string {
  return level === 'Platform' ? "the platform's own team" : level === 'Portfolio' ? 'Helix shared services' : 'the company team'
}

/** companies in scope where a hat has no head — the rule can't route there */
export function unroutableFor(
  rule: { level: RuleLevel; ownerCompanyId?: string; chain: string[]; resolution: ChainResolution },
  companies: { id: string; inPortfolio: boolean }[],
): string[] {
  if (rule.resolution === 'central' || rule.chain.length === 0) return []
  const inScope =
    rule.level === 'Platform'
      ? companies
      : rule.level === 'Portfolio'
        ? companies.filter((c) => c.inPortfolio)
        : companies.filter((c) => c.id === (rule.ownerCompanyId ?? 'acme'))
  return inScope.filter((c) => rule.chain.some((role) => !holderFor(c.id, role))).map((c) => c.id)
}

/** what children may do with a parent rule */
export type ChildControl = 'locked' | 'adjustable' | 'optional'
/** one entry in the change audit — who · what · when */
export type RuleEvent = { who: string; what: string; when: string }

export type Rule = {
  id: string
  name: string
  category: 'Time off' | 'Attendance' | 'Documents' | 'Onboarding' | 'Pay' | 'Exits'
  status: RuleStatus
  /** where the rule lives — who controls it */
  level: RuleLevel
  /** owning company when level === 'Company' */
  ownerCompanyId?: string
  /** posture toward descendants (meaningful when level !== 'Company') */
  childControl: ChildControl
  /** sentence-builder chunks: "Applies to {who} in {where} in {team}" */
  appliesTo: { who: string; where: string; team: string }
  /** extra "and..." clauses — the sentence grows, never becomes a filter grid */
  appliesAlso?: { dim: string; value: string }[]
  headcount: number
  /** approval pipeline, in order — ROLE HATS, not people */
  chain: string[]
  /** who fills the hats: 'local' = the requester's own company's people;
   *  'central' = the owner level's team decides for everyone */
  resolution: ChainResolution
  notify: string[]
  /** plain-language precedence outcome (never make users compute it) */
  shadowedBy?: string
  updated: string
  /** append-only change audit, newest last */
  history: RuleEvent[]
  /** the policy itself, when the rule IS a document people must read/sign */
  doc?: RuleDoc
  /** the rule as a TRIGGER: when X happens, do Y — each firing opens a ticket
   *  in the approver's inbox (nothing happens silently) */
  automation?: { when: string; then: string[]; firedThisWeek: number }
  /** the rule as a NUMBER: it sets a value other parts of the system read,
   *  varying by region/jurisdiction */
  computes?: { what: string; variants: { where: string; value: string }[]; feeds: string[] }
}

export type RuleDoc = {
  /** one line of what it says */
  summary: string
  sections: { title: string; body: string }[]
  /** every employee in scope must read & sign — it lands in their Documents inbox */
  requiresSignature: boolean
  /** highlight of the latest change, if any */
  whatChanged?: string
}

/* per-company signature rates (mock, consistent with coverageFor) */
const SIGN_RATES: Record<string, number> = { acme: 92, beta: 78, gamma: 64, delta: 88, epsilon: 51 }

/** who has signed, per company in MY scope — the analytics behind every policy */
export function signStatsFor(
  rule: Pick<Rule, 'level' | 'ownerCompanyId'>,
  companies: { id: string; employees: number; inPortfolio: boolean }[],
): { companyId: string; signed: number; total: number; pct: number }[] {
  const inScope =
    rule.level === 'Platform'
      ? companies
      : rule.level === 'Portfolio'
        ? companies.filter((c) => c.inPortfolio)
        : companies.filter((c) => c.id === (rule.ownerCompanyId ?? 'acme'))
  return inScope.map((c) => {
    const pct = SIGN_RATES[c.id] ?? 70
    return { companyId: c.id, signed: Math.round((c.employees * pct) / 100), total: c.employees, pct }
  })
}

/** inside one company: how signing splits by team (for the HR-admin view) */
export const TEAM_SIGN_SPLIT: { team: string; pct: number }[] = [
  { team: 'Engineering', pct: 96 },
  { team: 'Design', pct: 100 },
  { team: 'People', pct: 100 },
  { team: 'Sales', pct: 81 },
  { team: 'Finance', pct: 88 },
]

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
    headcount: 142, chain: ['HR'], resolution: 'local', notify: ['Person', 'HR'], updated: '4mo ago',
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '8 Jan' },
      { who: 'Legal council', what: 'Approved', when: '10 Jan' },
      { who: 'SatelliteHR', what: 'Enforced in Acme Tech, Beta Foods & Epsilon Studios · 251 people', when: '10 Jan' },
      { who: 'SatelliteHR', what: 'Delta Health joined — inherited automatically', when: '20 Jan' },
      { who: 'SatelliteHR', what: 'Gamma Retail joined — inherited automatically', when: '12 May' },
    ],
    doc: {
      summary: 'How we keep every workplace respectful — and exactly what happens when someone crosses the line.',
      requiresSignature: true,
      sections: [
        { title: 'What counts', body: 'Harassment is any unwelcome behaviour — verbal, physical, or written — that makes someone feel unsafe or small at work. Intent does not matter; impact does.' },
        { title: 'How to raise it', body: 'Tell your HR partner, any manager you trust, or use the anonymous form. Every report is logged, acknowledged within one working day, and handled by the internal committee.' },
        { title: 'What happens next', body: 'The committee investigates within 10 working days. Retaliation against anyone who reports is itself a violation, treated with the same severity.' },
      ],
    },
  },
  {
    id: 'r4', name: 'Global data protection', category: 'Documents', status: 'Running',
    level: 'Platform', childControl: 'locked',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Legal council'], resolution: 'central', notify: ['Person', 'HR'], updated: '1mo ago',
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '12 Jan' },
      { who: 'Legal council', what: 'Approved', when: '14 Jan' },
      { who: 'SatelliteHR', what: 'Enforced in all 5 companies · 508 people', when: '14 Jan' },
      { who: 'Maya Kapoor', what: 'Changed: added AI-tools clause (re-approved)', when: '2 May' },
      { who: 'SatelliteHR', what: 'Gamma Retail joined — inherited automatically', when: '12 May' },
    ],
    doc: {
      summary: 'How we handle customer and employee data — what we collect, where it lives, and what never leaves.',
      requiresSignature: true,
      whatChanged: 'New in May: rules for using AI tools with company data.',
      sections: [
        { title: 'Customer data', body: 'We collect only what the product needs. It stays in-region, encrypted, and is never sold or shared without a contract that says so.' },
        { title: 'Employee data', body: 'Your records belong to your employing company. Access is role-based and every view of sensitive fields is on the record.' },
        { title: 'AI tools at work', body: 'Public AI tools must never see customer or employee data. Use the approved internal tools — they keep everything inside our walls.' },
      ],
    },
  },
  {
    id: 'r6', name: 'Festive bonus letters', category: 'Documents', status: 'Draft',
    level: 'Portfolio', childControl: 'adjustable',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Finance', 'HR'], resolution: 'local', notify: ['Person'], updated: 'today',
    history: [{ who: 'David Chen', what: 'Drafted for the portfolio', when: 'today' }],
  },
  {
    id: 'r1', name: 'Casual & sick leave', category: 'Time off', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Manager'], resolution: 'local', notify: ['Person', 'Manager'], updated: '2w ago',
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
    headcount: 142, chain: ['Manager', 'HR'], resolution: 'local', notify: ['Person', 'Manager', 'HR'], updated: '2w ago',
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
    appliesAlso: [{ dim: 'tenure', value: 'who have been here over a year' }],
    headcount: 64, chain: ['Dept head', 'HR'], resolution: 'local', notify: ['Person', 'Manager'], updated: 'yesterday',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: 'Mon' },
      { who: 'Sara Iyer', what: 'Sent for approval', when: 'yesterday' },
    ],
  },
  {
    id: 'r7', name: 'Data handling (Acme addendum)', category: 'Documents', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: [], resolution: 'local', notify: ['Person', 'HR'],
    shadowedBy: 'Global data protection — set at platform level', updated: '1mo ago',
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '2 Mar' },
      { who: 'SatelliteHR', what: 'Shadowed by Global data protection (platform wins)', when: '2 Mar' },
    ],
  },
  {
    id: 'r9', name: 'Late check-in → half day', category: 'Attendance', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['HR'], resolution: 'local', notify: ['Person', 'Manager', 'HR'], updated: '1w ago',
    automation: {
      when: 'Someone checks in 5–10 minutes late, three times in a month',
      then: ['A half day is marked against their balance — but only after HR says yes', 'The person and their manager are told why'],
      firedThisWeek: 3,
    },
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '1 Jun' },
      { who: 'Ananya Rao', what: 'Approved', when: '2 Jun' },
      { who: 'SatelliteHR', what: 'Fired 3 times this week — 3 tickets to HR', when: 'this week' },
    ],
  },
  {
    id: 'r10', name: 'House rent allowance (HRA)', category: 'Pay', status: 'Running',
    level: 'Platform', childControl: 'locked',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['Finance'], resolution: 'central', notify: ['HR'], updated: '2mo ago',
    computes: {
      what: 'House rent allowance, as a share of basic pay',
      variants: [
        { where: 'Metro cities', value: '50% of basic pay' },
        { where: 'Everywhere else', value: '40% of basic pay' },
      ],
      feeds: ['Payroll (Phase II)', 'Offer letters', 'Tax statements'],
    },
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '2 Apr' },
      { who: 'Finance', what: 'Approved', when: '4 Apr' },
      { who: 'SatelliteHR', what: 'Enforced in all 5 companies — every payslip reads from it', when: '4 Apr' },
    ],
  },
  {
    id: 'r11', name: 'When someone absconds', category: 'Exits', status: 'Running',
    level: 'Portfolio', childControl: 'adjustable',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    headcount: 142, chain: ['HR'], resolution: 'local', notify: ['Manager', 'HR'], updated: '3w ago',
    automation: {
      when: 'Someone is absent 3 working days with no contact',
      then: [
        'Day 3 — their manager is asked to make contact',
        'Day 5 — an HR ticket opens and the official letter goes out',
        'Day 10 — exit process and laptop recovery begin — after HR approves',
      ],
      firedThisWeek: 1,
    },
    history: [
      { who: 'David Chen', what: 'Created for the portfolio', when: '12 May' },
      { who: 'HR council', what: 'Approved', when: '14 May' },
      { who: 'SatelliteHR', what: 'Enforced in Acme Tech, Beta Foods, Gamma Retail · 275 people', when: '14 May' },
      { who: 'SatelliteHR', what: 'Fired once — Dev Patel, day 3 today', when: 'yesterday' },
    ],
  },
  {
    id: 'r5', name: 'Day-one equipment checklist', category: 'Onboarding', status: 'Running',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'new joiners', where: 'everywhere', team: 'every team' },
    headcount: 3, chain: ['Manager', 'IT'], resolution: 'local', notify: ['Manager', 'IT'], updated: '3w ago',
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

/** the extensible "and..." dimensions (BRD §6.10: employment type, group,
 *  tenure, grade... — each clause reads as part of the sentence and scales
 *  the live headcount). Adding a dimension here is all it takes. */
export type ExtraDimension = { id: string; label: string; options: { value: string; factor: number }[] }

export const EXTRA_DIMENSIONS: ExtraDimension[] = [
  {
    id: 'type', label: 'Employment type',
    options: [
      { value: 'who are full-time', factor: 0.88 },
      { value: 'who are on contract', factor: 0.07 },
      { value: 'including interns', factor: 1.05 },
    ],
  },
  {
    id: 'tenure', label: 'Tenure',
    options: [
      { value: 'who joined in the last 6 months', factor: 0.12 },
      { value: 'who have been here over a year', factor: 0.62 },
    ],
  },
  {
    id: 'grade', label: 'Grade',
    options: [
      { value: 'in bands 1–2', factor: 0.45 },
      { value: 'in bands 3–4', factor: 0.34 },
      { value: 'in leadership', factor: 0.08 },
    ],
  },
  {
    id: 'shift', label: 'Shift',
    options: [
      { value: 'on the day shift', factor: 0.72 },
      { value: 'on the night shift', factor: 0.18 },
    ],
  },
  {
    id: 'probation', label: 'Probation',
    options: [
      { value: 'still on probation', factor: 0.07 },
      { value: 'past probation', factor: 0.9 },
    ],
  },
  {
    id: 'group', label: 'Group company',
    options: [{ value: 'in Meridian Group companies', factor: 0.41 }],
  },
]

/** headcount with the extra clauses applied — every clause narrows (or widens) the count */
export function extendedHeadcount(base: number, also: { dim: string; value: string }[] | undefined): number {
  if (!also || also.length === 0) return base
  const f = also.reduce((acc, c) => {
    const dim = EXTRA_DIMENSIONS.find((d) => d.id === c.dim)
    const opt = dim?.options.find((o) => o.value === c.value)
    return acc * (opt?.factor ?? 1)
  }, 1)
  return Math.max(1, Math.round(base * f))
}

/* ───────────────────────────────────── approval flows (BRD §6.25, jargon-free) */

/** one approval step — several roles on a step = they decide in parallel */
export type FlowStep = {
  id: string
  roles: string[]
  /** 'one' = any of them can approve · 'all' = every one must */
  mode: 'one' | 'all'
  /** plain-language deadline */
  sla: string
  /** when the deadline passes, it moves here */
  escalateTo?: string
  /** conditional routing — the step only runs when this is true */
  onlyWhen?: string
}

/** the kind of thing a flow routes — the columns of the parent's flow map */
export type FlowPurpose = 'Time off' | 'Hiring' | 'Exits' | 'Rule changes'
export const FLOW_PURPOSES: FlowPurpose[] = ['Time off', 'Hiring', 'Exits', 'Rule changes']

export type Flow = {
  id: string
  name: string
  /** the kind of thing it routes */
  purpose: FlowPurpose
  /** what it routes, in plain words */
  routes: string
  level: RuleLevel
  ownerCompanyId?: string
  status: 'Running' | 'Draft'
  steps: FlowStep[]
  /** who fills the hats — see ChainResolution on rules */
  resolution: ChainResolution
  /** how many rules / events use this flow */
  usedBy: number
  /** approvers can hand off while away */
  delegation: boolean
  history: RuleEvent[]
}

export const FLOWS: Flow[] = [
  {
    id: 'f1', name: 'Time-off approvals', purpose: 'Time off', routes: 'Every time-off request', level: 'Company', ownerCompanyId: 'acme',
    status: 'Running', resolution: 'local', usedBy: 2, delegation: true,
    steps: [
      { id: 's1', roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: 'Dept head' },
    ],
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '20 Feb' },
      { who: 'SatelliteHR', what: 'Running — routes every time-off request', when: '21 Feb' },
    ],
  },
  {
    id: 'f2', name: 'Job offers', purpose: 'Hiring', routes: 'Every offer before it goes out', level: 'Company', ownerCompanyId: 'acme',
    status: 'Running', resolution: 'local', usedBy: 1, delegation: true,
    steps: [
      { id: 's1', roles: ['Finance', 'HR'], mode: 'all', sla: 'within 2 days', escalateTo: 'Chief executive' },
      { id: 's2', roles: ['Chief executive'], mode: 'one', sla: 'within 1 day', onlyWhen: 'the offer is above ₹20L' },
    ],
    history: [
      { who: 'Sara Iyer', what: 'Created for Acme Tech', when: '3 Mar' },
      { who: 'Ananya Rao', what: 'Approved', when: '4 Mar' },
    ],
  },
  {
    id: 'f3', name: 'Rule changes', purpose: 'Rule changes', routes: 'Any change to a platform rule', level: 'Platform',
    status: 'Running', resolution: 'central', usedBy: 2, delegation: false,
    steps: [
      { id: 's1', roles: ['Legal council'], mode: 'one', sla: 'within 3 days', escalateTo: 'Platform operator' },
    ],
    history: [
      { who: 'Maya Kapoor', what: 'Created at platform level', when: '8 Jan' },
      { who: 'SatelliteHR', what: 'Gamma Retail joined — flow applies there automatically', when: '12 May' },
    ],
  },
  {
    id: 'f4', name: 'Exit clearance', purpose: 'Exits', routes: 'Every departure, before the last day', level: 'Company', ownerCompanyId: 'acme',
    status: 'Draft', resolution: 'local', usedBy: 0, delegation: true,
    steps: [
      { id: 's1', roles: ['IT', 'Finance', 'HR'], mode: 'all', sla: 'within 5 days', escalateTo: 'Dept head' },
    ],
    history: [{ who: 'Sara Iyer', what: 'Drafted', when: 'yesterday' }],
  },
  {
    id: 'f5', name: 'Time-off approvals', purpose: 'Time off', routes: 'Every time-off request', level: 'Company', ownerCompanyId: 'beta',
    status: 'Running', resolution: 'local', usedBy: 1, delegation: true,
    steps: [
      { id: 's1', roles: ['Manager'], mode: 'one', sla: 'within 2 days', escalateTo: 'HR' },
    ],
    history: [
      { who: 'Farhan Ali', what: 'Created for Beta Foods', when: '18 Mar' },
      { who: 'SatelliteHR', what: 'Running — adjusted for plant shifts', when: '19 Mar' },
    ],
  },
  {
    id: 'f6', name: 'Time-off approvals', purpose: 'Time off', routes: 'Every time-off request', level: 'Company', ownerCompanyId: 'delta',
    status: 'Running', resolution: 'local', usedBy: 2, delegation: true,
    steps: [
      { id: 's1', roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: 'HR' },
    ],
    history: [{ who: 'Delta Health', what: 'Created from the healthcare template', when: '22 Jan' }],
  },
  {
    id: 'f7', name: 'Exit clearance', purpose: 'Exits', routes: 'Every departure, before the last day', level: 'Company', ownerCompanyId: 'delta',
    status: 'Running', resolution: 'local', usedBy: 1, delegation: true,
    steps: [
      { id: 's1', roles: ['IT', 'Finance', 'HR'], mode: 'all', sla: 'within 5 days', escalateTo: 'Dept head' },
    ],
    history: [{ who: 'Delta Health', what: 'Created from the healthcare template', when: '22 Jan' }],
  },
]

export const FLOW_ROLE_OPTIONS = ['Manager', 'Dept head', 'HR', 'Finance', 'IT', 'Legal council', 'Chief executive'] as const

/* ───────────────────────────────────── roles & permissions (BRD §6.12, §5) */

export type RoleLevelName = 'Platform' | 'Portfolio' | 'Group' | 'Company'

export type PermGroup = { area: string; items: { id: string; label: string; on: boolean }[] }

export type Role = {
  id: string
  name: string
  level: RoleLevelName
  desc: string
  people: number
  /** built-ins can be viewed but not edited */
  builtIn: boolean
  perms: PermGroup[]
  clonedFrom?: string
}

const can = (id: string, label: string, on: boolean) => ({ id, label, on })

export const ROLES: Role[] = [
  {
    id: 'ro1', name: 'Platform operator', level: 'Platform', people: 2, builtIn: true,
    desc: 'Runs the whole platform — companies, platform rules, access.',
    perms: [
      { area: 'Companies', items: [can('c1', 'Create new companies', true), can('c2', 'Pause or resume any company', true), can('c3', 'See every company', true)] },
      { area: 'Rules & flows', items: [can('r1', 'Set platform-wide rules', true), can('r2', 'Approve rule changes', true)] },
      { area: 'Access', items: [can('a1', 'Create and edit roles', true), can('a2', 'See the full activity log', true)] },
    ],
  },
  {
    id: 'ro2', name: 'Support engineer', level: 'Platform', people: 4, builtIn: false, clonedFrom: 'Platform operator',
    desc: 'Helps companies get set up — looks, never touches.',
    perms: [
      { area: 'Companies', items: [can('c1', 'Create new companies', false), can('c2', 'Pause or resume any company', false), can('c3', 'See every company', true)] },
      { area: 'Rules & flows', items: [can('r1', 'Set platform-wide rules', false), can('r2', 'Approve rule changes', false)] },
      { area: 'Access', items: [can('a1', 'Create and edit roles', false), can('a2', 'See the full activity log', true)] },
    ],
  },
  {
    id: 'ro3', name: 'Portfolio manager', level: 'Portfolio', people: 3, builtIn: true,
    desc: 'Runs several companies from one seat — switch, standardize, report.',
    perms: [
      { area: 'Companies', items: [can('c3', 'See portfolio companies', true), can('c4', 'Switch between them', true), can('c2', 'Pause or resume a company', false)] },
      { area: 'Rules & flows', items: [can('r3', 'Roll out rules across the portfolio', true), can('r2', 'Approve rule changes', true)] },
      { area: 'Reports', items: [can('p1', 'Cross-company reports', true)] },
    ],
  },
  {
    id: 'ro4', name: 'Portfolio auditor', level: 'Portfolio', people: 1, builtIn: false, clonedFrom: 'Portfolio manager',
    desc: 'Oversight only — reads everything, changes nothing.',
    perms: [
      { area: 'Companies', items: [can('c3', 'See portfolio companies', true), can('c4', 'Switch between them', true), can('c2', 'Pause or resume a company', false)] },
      { area: 'Rules & flows', items: [can('r3', 'Roll out rules across the portfolio', false), can('r2', 'Approve rule changes', false)] },
      { area: 'Reports', items: [can('p1', 'Cross-company reports', true)] },
    ],
  },
  {
    id: 'ro5', name: 'Group admin', level: 'Group', people: 1, builtIn: true,
    desc: 'Looks after Meridian Group — shared offices, shared reporting.',
    perms: [
      { area: 'Companies', items: [can('c5', 'Manage group membership', true), can('c6', 'Share offices across the group', true)] },
      { area: 'Reports', items: [can('p2', 'Group-wide reports', true)] },
    ],
  },
  {
    id: 'ro6', name: 'HR admin', level: 'Company', people: 8, builtIn: true,
    desc: 'Owns people operations — rules, time off, documents, letters.',
    perms: [
      { area: 'People', items: [can('pe1', 'Add and edit people', true), can('pe2', 'See pay details', false)] },
      { area: 'Rules & flows', items: [can('r4', 'Create company rules', true), can('r5', 'Edit approval flows', true)] },
      { area: 'Time off', items: [can('t1', 'Fix balances with a reason', true)] },
    ],
  },
  {
    id: 'ro7', name: 'People manager', level: 'Company', people: 23, builtIn: true,
    desc: 'Leads a team — approves their requests, sees their basics.',
    perms: [
      { area: 'People', items: [can('pe3', 'See their team', true), can('pe1', 'Add and edit people', false)] },
      { area: 'Time off', items: [can('t2', 'Approve team time off', true), can('t3', 'Hand approvals to someone while away', true)] },
    ],
  },
  {
    id: 'ro8', name: 'Employee', level: 'Company', people: 470, builtIn: true,
    desc: 'Self-service — their own profile, time off, and documents.',
    perms: [
      { area: 'People', items: [can('pe4', 'Edit their own profile', true)] },
      { area: 'Time off', items: [can('t4', 'Request time off', true)] },
      { area: 'Documents', items: [can('d1', 'Read and confirm documents', true)] },
    ],
  },
]

/* ───────────────────────────────────── the activity log (BRD §6.29 — everything) */

export type AuditKind = 'Company' | 'Rule' | 'Flow' | 'Access' | 'People' | 'Time off' | 'Documents'

export type AuditEvent = {
  id: string
  who: string
  hue: number
  what: string
  detail?: string
  /** company name, group, or 'Platform' */
  where: string
  kind: AuditKind
  when: string
}

export const AUDIT_SEED: AuditEvent[] = [
  { id: 'ev1', who: 'Sara Iyer', hue: 2, what: 'Changed “Earned leave (3+ days)”', detail: 'Approval steps: Manager → Manager, then HR', where: 'Acme Tech', kind: 'Rule', when: '2h ago' },
  { id: 'ev2', who: 'Arjun Mehta', hue: 1, what: "Approved Rohan's casual leave", detail: 'Fri 13 Jun · within balance', where: 'Acme Tech', kind: 'Time off', when: '3h ago' },
  { id: 'ev3', who: 'SatelliteHR', hue: 5, what: 'Reminder sent: Code of conduct 2026', detail: '23 people still to confirm · due 20 Jun', where: 'Acme Tech', kind: 'Documents', when: '6h ago' },
  { id: 'ev4', who: 'David Chen', hue: 3, what: 'Drafted “Festive bonus letters” for the portfolio', detail: 'Will cover 3 companies · 275 people', where: 'Helix portfolio', kind: 'Rule', when: 'yesterday' },
  { id: 'ev5', who: 'Maya Kapoor', hue: 4, what: 'Created the “Support engineer” role', detail: 'Cloned from Platform operator · 3 permissions removed', where: 'Platform', kind: 'Access', when: 'yesterday' },
  { id: 'ev6', who: 'Gamma Retail', hue: 3, what: 'Finished its holiday calendar', detail: 'Setup now 68% done', where: 'Gamma Retail', kind: 'Company', when: 'yesterday' },
  { id: 'ev7', who: 'Lakshmi Iyer', hue: 2, what: 'Confirmed reading Global data protection', where: 'Beta Foods', kind: 'Documents', when: 'Mon' },
  { id: 'ev8', who: 'SatelliteHR', hue: 5, what: 'Gamma Retail inherited 2 platform rules', detail: 'Respect at work · Global data protection — automatic on joining', where: 'Gamma Retail', kind: 'Rule', when: '12 May' },
  { id: 'ev9', who: 'Maya Kapoor', hue: 4, what: 'Changed “Global data protection”', detail: 'Added AI-tools clause · re-approved by Legal council', where: 'Platform', kind: 'Rule', when: '2 May' },
  { id: 'ev10', who: 'Farhan Ali', hue: 0, what: 'Joined as Plant Manager', where: 'Beta Foods', kind: 'People', when: '28 Apr' },
  { id: 'ev11', who: 'Maya Kapoor', hue: 4, what: 'Paused Epsilon Studios', detail: '23 people lost sign-in · admins emailed', where: 'Epsilon Studios', kind: 'Company', when: '15 Apr' },
  { id: 'ev12', who: 'Sara Iyer', hue: 2, what: 'Created the “Job offers” flow', detail: 'Finance + HR together, then Chief executive', where: 'Acme Tech', kind: 'Flow', when: '3 Mar' },
]

/* ───────────────────────── inheritance & mutation coverage (per parent rule) */

export type CoverageState = 'Enforced' | 'Adjusted' | 'Pending'

export type CompanyCoverage = { companyId: string; state: CoverageState; ack: number }

/** how a parent rule is landing in each company in scope — mock but consistent */
export function coverageFor(
  rule: Pick<Rule, 'id' | 'level' | 'childControl'>,
  companies: { id: string; inPortfolio: boolean }[],
): CompanyCoverage[] {
  const inScope =
    rule.level === 'Platform' ? companies : rule.level === 'Portfolio' ? companies.filter((c) => c.inPortfolio) : []
  const ackById: Record<string, number> = { acme: 92, beta: 78, gamma: 64, delta: 88, epsilon: 51 }
  return inScope.map((c) => ({
    companyId: c.id,
    state:
      rule.childControl === 'adjustable' && c.id === 'beta'
        ? 'Adjusted'
        : (ackById[c.id] ?? 70) < 60
          ? 'Pending'
          : 'Enforced',
    ack: ackById[c.id] ?? 70,
  }))
}

/* ─────────────────────────────── hiring pipeline (BRD §6.13 — the ATS) */

export type CandidateStage = 'Applied' | 'Interviewing' | 'Offer' | 'Joining'
export const CANDIDATE_STAGES: CandidateStage[] = ['Applied', 'Interviewing', 'Offer', 'Joining']

export type Candidate = {
  id: string
  name: string
  hue: number
  /** the role they're being hired for */
  role: string
  stage: CandidateStage
  /** one human line of where things stand */
  meta: string
  /** interview panel score, when they've been seen */
  score?: number
  companyId: string
  /** where they came from (no external job boards in Phase 1) */
  source?: string
  /** resume on file */
  resume?: string
  /** who interviews them */
  panel?: string[]
  /** the next scheduled moment */
  nextStep?: string
  /** structured scorecard — criteria are configurable per opening */
  scorecard?: { area: string; score: number }[]
  /** reference checks, tracked and documented */
  references?: { who: string; note: string; done: boolean }[]
  /** the offer, once one exists */
  offer?: { template: string; status: string }
}

export const CANDIDATES: Candidate[] = [
  { id: 'cd1', name: 'Aman Verma', hue: 0, role: 'Senior QA', stage: 'Applied', meta: 'Applied 2 days ago · CV looks strong', companyId: 'acme', source: 'Careers page', resume: 'CV · 2 pages' },
  { id: 'cd2', name: 'Nidhi Rao', hue: 2, role: 'Senior QA', stage: 'Applied', meta: 'Referred by Rohan', companyId: 'acme', source: 'Referral — Rohan Gupta', resume: 'CV · 3 pages' },
  { id: 'cd3', name: 'Tanvi Shah', hue: 4, role: 'Product Designer', stage: 'Applied', meta: 'Portfolio worth a look', companyId: 'acme' },
  { id: 'cd4', name: 'Zaid Khan', hue: 1, role: 'Data Engineer', stage: 'Applied', meta: 'Applied yesterday', companyId: 'acme' },
  { id: 'cd5', name: 'Rhea Kapoor', hue: 3, role: 'Senior QA', stage: 'Interviewing', meta: 'Panel on Thursday · 2 of 3 rounds done', score: 4.1, companyId: 'acme',
    source: 'Careers page', resume: 'CV · 2 pages', panel: ['Arjun Mehta', 'Rohan Gupta', 'Meera Pillai'], nextStep: 'Final round · Thu 11:00, on everyone’s calendar',
    scorecard: [{ area: 'Problem solving', score: 4.5 }, { area: 'Craft & depth', score: 4.0 }, { area: 'Communication', score: 3.8 }] },
  { id: 'cd6', name: 'Mohit Jain', hue: 5, role: 'Product Designer', stage: 'Interviewing', meta: 'Design exercise in review', score: 3.8, companyId: 'acme' },
  { id: 'cd7', name: 'Sana Qureshi', hue: 2, role: 'Senior QA', stage: 'Offer', meta: 'Offer of ₹28L out — approval waiting in Inbox', score: 4.5, companyId: 'acme',
    source: 'Referral — Sara Iyer', resume: 'CV · 2 pages', panel: ['Arjun Mehta', 'Rohan Gupta', 'Ananya Rao'],
    scorecard: [{ area: 'Problem solving', score: 4.6 }, { area: 'Craft & depth', score: 4.5 }, { area: 'Communication', score: 4.4 }],
    references: [
      { who: 'Prior manager — TCS', note: '“Would rehire in a heartbeat.”', done: true },
      { who: 'Peer — Flipkart', note: '“The person you want on the hard bugs.”', done: true },
    ],
    offer: { template: 'Senior offer letter · v3', status: 'Sent electronically — approval waiting in Inbox, acceptance tracked' } },
  { id: 'cd8', name: 'Nikhil Bose', hue: 5, role: 'QA Engineer', stage: 'Joining', meta: 'Joins Mon 16 Jun · day-one checklist ready', score: 4.2, companyId: 'acme' },
]

/** how many more sit in the Applied pile beyond the cards we show */
export const APPLIED_OVERFLOW = 92

/* openings — BRD job requisitions: created, approved, assigned, tracked */
export type Opening = {
  id: string
  role: string
  team: string
  /** who runs the search */
  recruiter: string
  /** who they'll work for */
  hiringManager: string
  status: 'Open' | 'Waiting for approval' | 'Filled'
  candidates: number
  opened: string
  companyId: string
}

export const OPENINGS: Opening[] = [
  { id: 'op1', role: 'Senior QA', team: 'Engineering', recruiter: 'Sara Iyer', hiringManager: 'Arjun Mehta', status: 'Open', candidates: 38, opened: 'May 12', companyId: 'acme' },
  { id: 'op2', role: 'Product Designer', team: 'Design', recruiter: 'Tara Menon', hiringManager: 'Ananya Rao', status: 'Open', candidates: 27, opened: 'May 20', companyId: 'acme' },
  { id: 'op3', role: 'Data Engineer', team: 'Engineering', recruiter: 'Sara Iyer', hiringManager: 'Arjun Mehta', status: 'Open', candidates: 31, opened: 'Jun 2', companyId: 'acme' },
  { id: 'op4', role: 'Payroll Specialist', team: 'Finance', recruiter: 'Tara Menon', hiringManager: 'Isha Reddy', status: 'Waiting for approval', candidates: 0, opened: 'yesterday', companyId: 'acme' },
]

/* ──────────── policy studio (BRD §E through the OpsMaven lens) ──────────── */

/** how do we know — the first question every binding answers */
export type ClauseSensor = 'platform' | 'connector' | 'person'
export type ClauseBindingKind = 'sign' | 'watch' | 'report' | 'number' | 'deadline' | 'checklist' | 'training'

export type ClauseBinding = {
  kind: ClauseBindingKind
  sensor: ClauseSensor
  /** one plain line of how it works */
  how: string
  /** who acts when it fires */
  flow?: string
  notify?: string[]
  report?: { who: 'managers' | 'anyone'; anonymous: boolean; repeatThreshold?: string }
  deadline?: { target: string; met: number }
  value?: string
  checklist?: string[]
  training?: { course: string; within: string; completion: number }
}

export type PolicyClause = { id: string; title: string; body: string; binding?: ClauseBinding }

export type PolicyVersionEntry = { v: number; date: string; changes: string[]; material: boolean }

export type PolicyDocStatus = 'Draft' | 'Waiting for approval' | 'Published'

export type Policy = {
  id: string
  name: string
  /** OpsMaven service area */
  area: string
  level: RuleLevel
  ownerCompanyId?: string
  childControl: ChildControl
  appliesTo: { who: string; where: string; team: string }
  appliesAlso?: { dim: string; value: string }[]
  status: PolicyDocStatus
  version: number
  effectiveFrom: string
  channels: string[]
  clauses: PolicyClause[]
  versions: PolicyVersionEntry[]
  history: RuleEvent[]
  /** aggregate read-and-sign, when a sign clause exists */
  signPct?: number
}

export const POLICY_CHANNELS = [
  'Platform sign-off',
  'Email notice',
  'Day-1 onboarding pack',
  'Self-service handbook',
] as const

export type PolicyTemplate = {
  id: string
  name: string
  area: string
  desc: string
  covers: string[]
  /** "how performance is measured" — the deadline clauses, surfaced on the card */
  slas: string[]
  countryVariants?: string[]
  clauses: PolicyClause[]
  /** gallery breadth entries — no wired clauses yet */
  light?: boolean
}

const signClause = (id: string): PolicyClause => ({
  id,
  title: 'Read & accept this policy',
  body: 'Everyone covered confirms they have read and accepted it. Signatures are tracked per company and team.',
  binding: { kind: 'sign', sensor: 'platform', how: 'Read-and-sign tracked — receipts on the record' },
})

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'pt1', name: 'Remote & Hybrid Work', area: 'Workplace',
    desc: 'Hybrid schedules, client-call etiquette, and allowances — the modern default.',
    covers: ['Hybrid schedules & reachability', 'Client-call etiquette', 'Work-from-home allowance'],
    slas: [],
    clauses: [
      {
        id: 'c1', title: 'Cameras on in client meetings',
        body: 'Join every client-facing call with your camera on. Exceptions: connectivity or an agreed accommodation.',
        binding: {
          kind: 'report', sensor: 'person', how: 'Anyone can report a concern — or something good',
          flow: 'Manager → HR · within 2 days', notify: ['Person', 'Manager'],
          report: { who: 'anyone', anonymous: false, repeatThreshold: '3 concerns in a quarter → Dept head' },
        },
      },
      {
        id: 'c2', title: 'Work-from-home allowance',
        body: 'A monthly allowance covers home-office costs, paid with salary.',
        binding: { kind: 'number', sensor: 'platform', how: 'Feeds payroll and offer letters', value: '₹2,500 / month' },
      },
      { id: 'c3', title: 'Reachable 10:00–16:00', body: 'Core hours: be reachable on chat and for calls, whatever your location.' },
      signClause('c4'),
    ],
  },
  {
    id: 'pt2', name: 'Respect at Work (POSH)', area: 'Employee relations',
    desc: 'Zero tolerance, anonymous reporting, committee timelines, annual training.',
    covers: ['What counts & zero tolerance', 'Anonymous reporting', 'Committee timelines'],
    slas: ['Committee acknowledges within 24 hours', 'Cases resolved within 10 working days'],
    clauses: [
      signClause('c1'),
      {
        id: 'c2', title: 'Anyone can raise a concern',
        body: 'Reports go to the internal committee. The reporter is always anonymous unless they choose otherwise.',
        binding: {
          kind: 'report', sensor: 'person', how: 'Always-anonymous reporting to the committee',
          flow: 'POSH committee · acknowledge in 24h', notify: ['HR'],
          report: { who: 'anyone', anonymous: true },
        },
      },
      {
        id: 'c3', title: 'Committee resolves within 10 working days',
        body: 'Every case is investigated and closed inside the statutory window.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Statutory timeline tracked per case', deadline: { target: 'within 10 working days', met: 100 } },
      },
      {
        id: 'c4', title: 'Annual POSH training',
        body: 'Everyone completes POSH essentials within 30 days of joining, then yearly.',
        binding: { kind: 'training', sensor: 'platform', how: 'Completion tracked; overdue → reminder → HR', training: { course: 'POSH essentials', within: '30 days of joining', completion: 91 } },
      },
    ],
  },
  {
    id: 'pt3', name: 'Code of Conduct', area: 'Governance',
    desc: 'How we treat each other, customers, data, and AI tools.',
    covers: ['Behaviour & conflicts of interest', 'AI tools at work', 'Gifts & disclosures'],
    slas: [],
    clauses: [
      signClause('c1'),
      {
        id: 'c2', title: 'Conflicts of interest are disclosed',
        body: 'Outside work, investments, or relationships that could conflict — disclose them.',
        binding: {
          kind: 'report', sensor: 'person', how: 'Self-disclosure or a concern, routed quietly',
          flow: 'HR → Legal council · within 3 days', report: { who: 'anyone', anonymous: false },
        },
      },
      {
        id: 'c3', title: 'Public AI tools never see company data',
        body: 'Use the approved internal tools only.',
        binding: { kind: 'report', sensor: 'person', how: 'Concerns reported; connector check is Phase II', flow: 'IT → HR · within 2 days', report: { who: 'anyone', anonymous: false } },
      },
    ],
  },
  {
    id: 'pt4', name: 'Onboarding & Day-1 Readiness', area: 'Onboarding',
    desc: 'Every new joiner walks into a working day one.',
    covers: ['Pre-joining documents', 'Device & access readiness', 'Manager readiness'],
    slas: ['100% day-1 access for every new hire', 'Device handover within 24 hours'],
    clauses: [
      {
        id: 'c1', title: 'Day-1 access is ready before day 1',
        body: 'Email, HRIS, and collaboration access live before the start date.',
        binding: { kind: 'checklist', sensor: 'platform', how: 'Tasks fire when an offer is accepted', checklist: ['Laptop handed over', 'Email + HRIS live', 'Access card issued', 'Seat assigned'] },
      },
      {
        id: 'c2', title: 'Device handover within 24 hours',
        body: 'New joiners hold their device by the end of day one.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per joiner', deadline: { target: 'within 24 hours', met: 96 } },
      },
      {
        id: 'c3', title: 'Manager ready: a first-week plan exists',
        body: 'The manager writes the first-week plan before the joiner arrives.',
        binding: { kind: 'checklist', sensor: 'platform', how: 'A task lands with the manager at offer-accept', checklist: ['First-week plan written', 'Buddy assigned'] },
      },
    ],
  },
  {
    id: 'pt5', name: 'Exit & Final Settlement', area: 'Exits',
    desc: 'Orderly exits: clearance, recoveries, settlement — on the clock.',
    covers: ['Exit workflows & clearance', 'Recoveries & notices', 'Final settlement'],
    slas: ['Exit initiated within 1 business day', 'Final settlement in 1 working day'],
    clauses: [
      {
        id: 'c1', title: 'Exit starts within 1 business day',
        body: 'Resignation or decision → the exit workflow opens the same day.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per exit', deadline: { target: 'within 1 business day', met: 100 } },
      },
      {
        id: 'c2', title: 'Clearance runs as a checklist',
        body: 'IT, assets, finance, and knowledge handover — each with an owner.',
        binding: { kind: 'checklist', sensor: 'platform', how: 'Tasks fire on exit start', checklist: ['IT access revoked', 'Assets returned', 'Finance recoveries', 'Knowledge handover'] },
      },
      {
        id: 'c3', title: 'Final settlement in 1 working day',
        body: 'Full-and-final computed and paid within one working day of last day.',
        binding: { kind: 'deadline', sensor: 'platform', how: '100% accuracy target, every exit', deadline: { target: 'within 1 working day', met: 98 } },
      },
    ],
  },
  {
    id: 'pt6', name: 'Payroll & Statutory Calendar', area: 'Payroll',
    desc: 'Payroll as a governed routine — pre-validated, filed on time, evidenced.',
    covers: ['Payroll pre-validation', 'Statutory filings', 'Registers & evidence'],
    slas: ['Pre-validation by T+3', '100% filings by statutory due dates'],
    countryVariants: ['India', 'US', 'ANZ', 'Mexico'],
    clauses: [
      {
        id: 'c1', title: 'Payroll pre-validated by T+3',
        body: 'Inputs reconciled and validated three days before the run.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per run', deadline: { target: 'by T+3 days', met: 100 } },
      },
      {
        id: 'c2', title: 'Statutory filings by due date',
        body: 'India: PF/ESI/PT/TDS · US: federal/state · ANZ: PAYG/Super · Mexico: IMSS/ISR.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Country calendar drives the dates', deadline: { target: 'by each due date', met: 100 } },
      },
      {
        id: 'c3', title: 'Registers stay current',
        body: 'Statutory registers updated with every run, audit-ready.',
        binding: { kind: 'watch', sensor: 'platform', how: 'The system flags any register older than its run' },
      },
    ],
  },
  {
    id: 'pt7', name: 'Hiring Service Levels', area: 'Hiring',
    desc: 'The hiring promises, measured: scheduling, offers, feedback.',
    covers: ['Interview scheduling', 'Offer turnaround', 'Structured feedback'],
    slas: ['Interviews scheduled within 48 hours', 'Offer letter within 1 business day'],
    clauses: [
      {
        id: 'c1', title: 'Interviews scheduled within 48 hours',
        body: 'Shortlist → calendar invite inside two days.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per candidate', deadline: { target: 'within 48 hours', met: 88 } },
      },
      {
        id: 'c2', title: 'Offer letter within 1 business day',
        body: 'Approved offer → letter out the next business day.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per offer', deadline: { target: 'within 1 business day', met: 92 } },
      },
      {
        id: 'c3', title: 'Panel feedback within 24 hours',
        body: 'Scorecards in by the next day, every round.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per round', deadline: { target: 'within 24 hours', met: 84 } },
      },
    ],
  },
  {
    id: 'pt8', name: 'Leave & Attendance', area: 'Time',
    desc: 'Clean time data: punctuality, carryover, reconciliation.',
    covers: ['Check-in expectations', 'Carryover logic', 'Exception clearance'],
    slas: ['Exceptions reconciled by T+2'],
    clauses: [
      {
        id: 'c1', title: 'Check-in by 9:05',
        body: 'Three late check-ins in a month proposes a half-day — HR decides.',
        binding: { kind: 'watch', sensor: 'platform', how: 'Fires automatically; each firing is a ticket to HR', flow: 'HR · within 1 day' },
      },
      {
        id: 'c2', title: 'Carryover up to 10 days',
        body: 'Unused earned leave carries into January, capped.',
        binding: { kind: 'number', sensor: 'platform', how: 'Feeds balances at year end', value: '10 days max' },
      },
      {
        id: 'c3', title: 'Exceptions reconciled by T+2',
        body: 'Missed punches and disputes cleared within two days.',
        binding: { kind: 'deadline', sensor: 'platform', how: 'Measured per exception', deadline: { target: 'by T+2 days', met: 94 } },
      },
    ],
  },
  { id: 'pt9', name: 'Benefits & Claims', area: 'Benefits', desc: 'Enrollment windows, claims response, vendor coordination.', covers: ['Enrollment in 3 business days', 'Claims response in 24 hours'], slas: ['Claims response within 24 hours'], clauses: [], light: true },
  { id: 'pt10', name: 'Performance Cycle', area: 'Performance', desc: 'Goal cadence, review workflows, calibration logistics.', covers: ['Cycle launch in 5 days', 'Comp changes in 2 days'], slas: ['Review cycle launch within 5 business days'], clauses: [], light: true },
  { id: 'pt11', name: 'Expense & Travel', area: 'Finance', desc: 'What gets reimbursed, approval limits, travel classes.', covers: ['Approval limits', 'Per-diem by city'], slas: [], clauses: [], light: true },
  { id: 'pt12', name: 'Data Protection', area: 'Governance', desc: 'Customer and employee data handling, AI tools, retention.', covers: ['Data handling', 'Retention windows'], slas: [], clauses: [], light: true },
  { id: 'pt13', name: 'Grievance & ER Cases', area: 'Employee relations', desc: 'Ticketed grievances, investigation support, case logs.', covers: ['Acknowledge in 24 hours', 'Statutory adherence'], slas: ['ER case acknowledged within 24 hours'], clauses: [], light: true },
  { id: 'pt14', name: 'Probation & Confirmation', area: 'Lifecycle', desc: 'Evaluation criteria, confirm/extend decisions, timelines.', covers: ['Decision before day 90', 'Manager + HR sign-off'], slas: [], clauses: [], light: true },
]

export const POLICIES: Policy[] = [
  {
    id: 'pol1', name: 'Remote & Hybrid Work', area: 'Workplace',
    level: 'Portfolio', childControl: 'adjustable',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    status: 'Published', version: 2, effectiveFrom: '1 Jul 2026',
    channels: ['Platform sign-off', 'Email notice', 'Day-1 onboarding pack', 'Self-service handbook'],
    clauses: POLICY_TEMPLATES[0].clauses,
    versions: [
      { v: 1, date: '2 Mar', changes: ['First published'], material: true },
      { v: 2, date: 'today', changes: ['WFH allowance ₹2,000 → ₹2,500', 'Reworded core hours (cosmetic)'], material: true },
    ],
    signPct: 84,
    history: [
      { who: 'David Chen', what: 'Created from the Remote & Hybrid Work template', when: '28 Feb' },
      { who: 'HR council', what: 'Approved', when: '1 Mar' },
      { who: 'SatelliteHR', what: 'v1 published in Acme Tech, Beta Foods, Gamma Retail · 275 people', when: '2 Mar' },
      { who: 'David Chen', what: 'v2: allowance raised to ₹2,500 (material) — re-approved', when: 'today' },
      { who: 'SatelliteHR', what: 'v2 publishes 1 Jul — 273 re-sign (allowance clause), 2 get a notice', when: 'today' },
    ],
  },
  {
    id: 'pol2', name: 'Onboarding & Day-1 Readiness', area: 'Onboarding',
    level: 'Company', ownerCompanyId: 'acme', childControl: 'optional',
    appliesTo: { who: 'new joiners', where: 'everywhere', team: 'every team' },
    status: 'Published', version: 1, effectiveFrom: '1 Mar 2026',
    channels: ['Platform sign-off', 'Day-1 onboarding pack'],
    clauses: POLICY_TEMPLATES[3].clauses,
    versions: [{ v: 1, date: '1 Mar', changes: ['First published'], material: true }],
    history: [
      { who: 'Sara Iyer', what: 'Created from the Onboarding template', when: '25 Feb' },
      { who: 'Ananya Rao', what: 'Approved', when: '28 Feb' },
      { who: 'SatelliteHR', what: 'Published — fires per new joiner', when: '1 Mar' },
    ],
  },
  {
    id: 'pol3', name: 'Payroll & Statutory Calendar — India', area: 'Payroll',
    level: 'Portfolio', childControl: 'locked',
    appliesTo: { who: 'all employees', where: 'everywhere', team: 'every team' },
    status: 'Waiting for approval', version: 1, effectiveFrom: 'on approval',
    channels: ['Platform sign-off', 'Self-service handbook'],
    clauses: [
      ...POLICY_TEMPLATES[5].clauses,
      {
        id: 'c4',
        title: 'Read & accept this policy',
        body: 'Everyone covered confirms they have read the payroll calendar and statutory commitments.',
        binding: { kind: 'sign', sensor: 'platform', how: 'Read-and-sign tracked — receipts on the record' },
      },
    ],
    versions: [{ v: 1, date: 'yesterday', changes: ['Drafted from the India variant'], material: true }],
    history: [
      { who: 'David Chen', what: 'Created from the Payroll template (India variant)', when: 'yesterday' },
      { who: 'David Chen', what: 'Sent for approval — Finance, then HR council', when: 'yesterday' },
    ],
  },
]

/* observations — humans are the sensor (report bindings) */
export type Observation = {
  id: string
  about: string
  aboutHue: number
  clause: string
  policy: string
  polarity: 'concern' | 'kudos'
  note: string
  by: string
  anonymous: boolean
  status: 'open' | 'resolved'
  when: string
  repeat?: string
}

export const OBSERVATIONS: Observation[] = [
  {
    id: 'ob1', about: 'Dev Patel', aboutHue: 3, clause: 'Cameras on in client meetings', policy: 'Remote & Hybrid Work',
    polarity: 'concern', note: 'Camera off through the entire Acme client demo.', by: 'Arjun Mehta', anonymous: false,
    status: 'open', when: '2h ago', repeat: '3rd concern this quarter — escalates to Dept head',
  },
  {
    id: 'ob2', about: 'Priya Nair', aboutHue: 4, clause: 'Cameras on in client meetings', policy: 'Remote & Hybrid Work',
    polarity: 'kudos', note: 'Ran the client walkthrough flawlessly — camera, prep, the lot.', by: 'Arjun Mehta', anonymous: false,
    status: 'resolved', when: 'yesterday',
  },
  {
    id: 'ob3', about: 'Kabir Singh', aboutHue: 1, clause: 'Cameras on in client meetings', policy: 'Remote & Hybrid Work',
    polarity: 'concern', note: 'Joined the Friday client sync audio-only, no heads-up.', by: 'Vikram Shah', anonymous: false,
    status: 'resolved', when: 'Mon',
  },
]

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
