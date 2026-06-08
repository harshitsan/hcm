/**
 * Per-company data layer. Kensium Pvt Ltd (c1) uses the rich hand-authored data in
 * mock.ts; every other company gets a distinct, deterministic dataset so that
 * switching the company context visibly re-populates every screen.
 *
 * Pages get their data via useCompanyData() instead of importing globals.
 */
import { useMemo } from 'react'
import { useApp } from '../app/store'
import {
  companies,
  departments as acmeDepartments,
  employees as acmeEmployees,
  getEmployee as acmeGetEmployee,
  getDepartment as acmeGetDepartment,
  reportsOf as acmeReportsOf,
  inbox as acmeInbox,
  leaveBalances as acmeLeaveBalances,
  leaveRequests as acmeLeaveRequests,
  policies as acmePolicies,
  documents as acmeDocuments,
  candidates as acmeCandidates,
  requisitions as acmeRequisitions,
  onboardingTasks as acmeOnboarding,
  auditLog as acmeAudit,
  attendanceWeek as acmeAttendanceWeek,
  attendanceMix as acmeAttendanceMix,
  headcountTrend as acmeHeadcountTrend,
  headcountByDept as acmeHeadcountByDept,
  leaveByMonth as acmeLeaveByMonth,
  type Company,
  type Department,
  type Employee,
  type InboxItem,
  type LeaveRequest,
  type Policy,
  type AuditEntry,
  type Candidate,
  type OnboardingTask,
} from './mock'

export type CompanyData = {
  company: Company
  employees: Employee[]
  departments: Department[]
  getEmployee: (id: string | null) => Employee | null
  getDepartment: (id: string) => Department | null
  reportsOf: (managerId: string) => Employee[]
  inbox: InboxItem[]
  leaveBalances: { type: string; used: number; total: number; tone: 'primary' | 'info' | 'accent' | 'warning' }[]
  leaveRequests: LeaveRequest[]
  policies: Policy[]
  documents: { id: string; name: string; type: string; owner: string; expiry: string; size: string }[]
  candidates: Candidate[]
  requisitions: { id: string; title: string; dept: string; openings: number; applicants: number; status: string }[]
  onboardingTasks: OnboardingTask[]
  auditLog: AuditEntry[]
  attendanceWeek: { day: string; status: string; in: string; out: string }[]
  attendanceMix: { name: string; value: number; tone: string }[]
  headcountTrend: { month: string; value: number }[]
  headcountByDept: { dept: string; value: number }[]
  leaveByMonth: { month: string; annual: number; sick: number }[]
}

/* ----------------------------------------------------------------- seeded RNG */
function hash(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Aarav', 'Vivaan', 'Ishaan', 'Diya', 'Ananya', 'Kabir', 'Aisha', 'Rohan', 'Saanvi', 'Arnav', 'Myra', 'Vihaan', 'Kiara', 'Reyansh', 'Anaya', 'Neha', 'Rajat', 'Pooja', 'Sameer', 'Tara', 'Yash', 'Isha', 'Dev', 'Nisha', 'Aditya', 'Riya', 'Karthik', 'Sara', 'Manish', 'Leela']
const LAST = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Mehta', 'Kapoor', 'Desai', 'Menon', 'Khan', 'Sheikh', 'Thomas', 'Bose', 'Gupta', 'Reddy', 'Pillai', 'Chopra', 'Banerjee', 'Rao', 'Joshi', 'Malhotra']

const DEPT_NAMES = ['Executive', 'Engineering', 'Sales', 'Finance', 'Human Resources', 'Operations']
const DEPT_SHORT: Record<string, string> = { Executive: 'Exec', Engineering: 'Eng', Sales: 'Sales', Finance: 'Finance', 'Human Resources': 'HR', Operations: 'Ops' }
const IC_TITLES: Record<string, string[]> = {
  Engineering: ['Backend Engineer', 'Frontend Engineer', 'QA Engineer', 'DevOps Engineer', 'Data Engineer'],
  Sales: ['Account Executive', 'Sales Associate', 'BD Manager'],
  Finance: ['Accountant', 'Financial Analyst', 'Treasury Analyst'],
  'Human Resources': ['Recruiter', 'HR Associate', 'HR Business Partner'],
  Operations: ['Ops Associate', 'Logistics Coordinator', 'Ops Analyst'],
}
const CITY_BY_STATE: Record<string, string> = {
  Maharashtra: 'Mumbai', Karnataka: 'Bengaluru', Delhi: 'Delhi', 'Tamil Nadu': 'Chennai', Telangana: 'Hyderabad', Gujarat: 'Ahmedabad',
}

function generate(company: Company): CompanyData {
  const rng = mulberry32(hash(company.id))
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  const between = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))

  const state = (company.jurisdiction.split('·')[1] || '').trim()
  const city = CITY_BY_STATE[state] || state || 'HQ'
  const locations = [`${city} HQ`, `${city} Office`, 'Remote']
  const domain = company.name.toLowerCase().replace(/[^a-z]/g, '') + '.example'

  // unique names
  const used = new Set<string>()
  const nextName = () => {
    for (let i = 0; i < 50; i++) {
      const n = `${pick(FIRST)} ${pick(LAST)}`
      if (!used.has(n)) {
        used.add(n)
        return n
      }
    }
    return `${pick(FIRST)} ${pick(LAST)} ${used.size}`
  }
  const emailOf = (name: string) => name.toLowerCase().split(' ').slice(0, 2).join('.').replace(/[^a-z.]/g, '') + '@' + domain
  const phone = (i: number) => `+91 9${between(2, 8)}${String(10000000 + i * 137 + between(0, 99)).slice(0, 7)}`

  const departments: Department[] = []
  const employees: Employee[] = []

  // CEO
  const ceoName = nextName()
  employees.push({ id: 'e1', name: ceoName, email: emailOf(ceoName), title: 'Chief Executive Officer', departmentId: 'd1', location: locations[0], managerId: null, status: 'Active', type: 'Employee', joinDate: '2018-05-10', phone: phone(1) })
  departments.push({ id: 'd1', name: 'Executive', head: ceoName, parentId: null, headcount: between(3, 8) })

  // department heads (d2..d6)
  const heads: Record<string, string> = {}
  DEPT_NAMES.slice(1).forEach((dn, idx) => {
    const did = `d${idx + 2}`
    const hName = nextName()
    heads[did] = 'e' + (idx + 2)
    employees.push({ id: 'e' + (idx + 2), name: hName, email: emailOf(hName), title: `${dn === 'Human Resources' ? 'HR' : dn} Head`, departmentId: did, location: locations[0], managerId: 'e1', status: 'Active', type: 'Employee', joinDate: `20${between(19, 21)}-0${between(1, 9)}-1${between(0, 9)}`, phone: phone(idx + 2) })
    departments.push({ id: did, name: dn, head: hName, parentId: 'd1', headcount: 0 })
  })

  // ICs
  const size = Math.max(7, Math.min(13, Math.round(company.employees / 18) + 7))
  for (let i = employees.length; i < size; i++) {
    const did = 'd' + between(2, 6)
    const dept = DEPT_NAMES[Number(did.slice(1)) - 1]
    const nm = nextName()
    const roll = rng()
    const status: Employee['status'] = roll > 0.9 ? 'Probation' : roll > 0.8 ? 'On Leave' : 'Active'
    employees.push({
      id: 'e' + (i + 1), name: nm, email: emailOf(nm), title: pick(IC_TITLES[dept] || ['Associate']),
      departmentId: did, location: pick(locations), managerId: heads[did] || 'e1',
      status, type: rng() > 0.85 ? 'Contractor' : 'Employee',
      joinDate: `20${between(21, 25)}-0${between(1, 9)}-1${between(0, 9)}`, phone: phone(i + 1),
    })
  }
  // one onboarding new hire
  const newHireName = nextName()
  const obId = 'e' + (employees.length + 1)
  employees.push({ id: obId, name: newHireName, email: emailOf(newHireName), title: 'New Hire — Associate', departmentId: 'd' + between(2, 6), location: pick(locations), managerId: 'e2', status: 'Onboarding', type: 'Employee', joinDate: '2026-06-20', phone: phone(99) })

  // headcount per dept scaled to company size
  const sampleTotal = employees.length
  const scale = company.employees / sampleTotal
  departments.forEach((d) => {
    const c = employees.filter((e) => e.departmentId === d.id).length
    d.headcount = Math.max(1, Math.round(c * scale))
  })

  const getEmployee = (id: string | null) => employees.find((e) => e.id === id) ?? null
  const getDepartment = (id: string) => departments.find((d) => d.id === id) ?? null
  const reportsOf = (managerId: string) => employees.filter((e) => e.managerId === managerId)

  const names = employees.map((e) => e.name)
  const mons = ['Jun 10', 'Jun 9', 'Jun 12', 'Jun 8', 'Jun 11', 'Jun 7']

  const inboxTypes: InboxItem['type'][] = ['Leave', 'Onboarding', 'Policy Ack', 'Transfer', 'Timesheet', 'Offer', 'Asset']
  const inbox: InboxItem[] = Array.from({ length: between(3, 6) }, (_, i) => ({
    id: `${company.id}-i${i}`,
    type: inboxTypes[i % inboxTypes.length],
    title: ['Annual leave · 2 days', 'Verify documents', 'Acknowledge: Code of Conduct v3', 'Transfer request', 'Approve timesheet · wk 23', 'Approve offer'][i % 6],
    requester: pick(names),
    date: pick(mons),
    slaPct: between(20, 95),
    priority: (['High', 'Normal', 'Low'] as const)[between(0, 2)],
  }))

  const leaveBalances = [
    { type: 'Annual', used: between(2, 12), total: 21, tone: 'primary' as const },
    { type: 'Sick', used: between(0, 8), total: 12, tone: 'info' as const },
    { type: 'Casual', used: between(0, 6), total: 7, tone: 'accent' as const },
    { type: 'Comp-off', used: between(0, 3), total: 4, tone: 'warning' as const },
  ]

  const lTypes: LeaveRequest['type'][] = ['Annual', 'Sick', 'Casual', 'Comp-off']
  const lStatus: LeaveRequest['status'][] = ['Pending', 'Pending', 'Approved', 'Approved', 'Rejected']
  const leaveRequests: LeaveRequest[] = Array.from({ length: between(4, 6) }, (_, i) => {
    const days = between(1, 4)
    return { id: `${company.id}-l${i}`, employee: pick(names), type: pick(lTypes), from: `Jun ${between(1, 20)}`, to: `Jun ${between(20, 28)}`, days, status: lStatus[i % lStatus.length], reason: pick(['Family function', 'Fever', 'Personal errand', 'Vacation', 'Medical']) }
  })

  const policies: Policy[] = acmePolicies.map((p, i) => ({ ...p, id: `${company.id}-po${i}`, ackPct: p.status === 'Draft' ? 0 : between(55, 98) }))

  const documents = [
    { id: `${company.id}-doc1`, name: `${company.name} Handbook 2026.pdf`, type: 'PDF', owner: 'HR', expiry: '—', size: '1.6 MB' },
    { id: `${company.id}-doc2`, name: 'GST Certificate.pdf', type: 'PDF', owner: 'Finance', expiry: '2027-03-31', size: '480 KB' },
    { id: `${company.id}-doc3`, name: 'Insurance Policy.pdf', type: 'PDF', owner: 'HR', expiry: '2026-09-15', size: '1.0 MB' },
    { id: `${company.id}-doc4`, name: `Offer — ${newHireName}.pdf`, type: 'PDF', owner: 'Recruiting', expiry: '—', size: '220 KB' },
  ]

  const stages: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
  const candidates: Candidate[] = Array.from({ length: between(5, 7) }, (_, i) => ({
    id: `${company.id}-cd${i}`, name: nextName(), role: pick(['Backend Engineer', 'Data Analyst', 'Account Executive', 'Recruiter']),
    stage: stages[i % stages.length], rating: between(0, 5),
  }))

  const requisitions = departments.slice(1, 4).map((d, i) => ({
    id: `${company.id}-rq${i}`, title: pick(IC_TITLES[d.name] || ['Associate']), dept: d.name, openings: between(1, 3), applicants: between(8, 45), status: i === 2 ? 'On hold' : 'Open',
  }))

  const onboardingTasks: OnboardingTask[] = acmeOnboarding.map((t, i) => ({
    ...t, id: `${company.id}-ob${i}`,
    owner: t.owner === 'IT' ? 'IT' : i === 0 || i === 1 || i === 5 ? newHireName : pick(names),
    status: i < between(1, 3) ? 'Done' : i === between(2, 3) ? 'In progress' : 'Pending',
  }))

  const actions = ['Updated', 'Approved', 'Published', 'Created', 'Context switch']
  const auditLog: AuditEntry[] = Array.from({ length: between(4, 6) }, (_, i) => ({
    id: `${company.id}-a${i}`, time: `2026-06-0${between(5, 8)} 1${between(0, 9)}:${between(10, 59)}`,
    actor: pick(names), action: actions[i % actions.length],
    entity: pick(['Employee', 'Leave', 'Policy', 'Company', 'Timesheet']) + ' · ' + pick(names),
    detail: pick(['status change', 'field updated', 'audience: all', 'approved 1 day', 'role assigned']),
  }))

  const present = Math.round(company.employees * 0.86)
  const wfh = Math.round(company.employees * 0.1)
  const onLeave = Math.round(company.employees * 0.03)
  const absent = Math.max(1, company.employees - present - wfh - onLeave)
  const attendanceMix = [
    { name: 'Present', value: present, tone: '#16a34a' },
    { name: 'WFH', value: wfh, tone: '#4f46e5' },
    { name: 'On leave', value: onLeave, tone: '#d97706' },
    { name: 'Absent', value: absent, tone: '#dc2626' },
  ]

  const headcountTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
    month, value: Math.round(company.employees * (0.86 + i * 0.028)),
  }))
  const headcountByDept = departments
    .filter((d) => d.name !== 'Executive')
    .map((d) => ({ dept: DEPT_SHORT[d.name] || d.name, value: d.headcount }))
  const leaveByMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => ({
    month, annual: between(10, 45), sick: between(5, 18),
  }))

  return {
    company, employees, departments, getEmployee, getDepartment, reportsOf,
    inbox, leaveBalances, leaveRequests, policies, documents, candidates, requisitions,
    onboardingTasks, auditLog, attendanceWeek: acmeAttendanceWeek, attendanceMix,
    headcountTrend, headcountByDept, leaveByMonth,
  }
}

/* Kensium Pvt Ltd (c1) keeps the rich hand-authored dataset. */
const acmeData = (company: Company): CompanyData => ({
  company,
  employees: acmeEmployees,
  departments: acmeDepartments,
  getEmployee: acmeGetEmployee,
  getDepartment: acmeGetDepartment,
  reportsOf: acmeReportsOf,
  inbox: acmeInbox,
  leaveBalances: acmeLeaveBalances,
  leaveRequests: acmeLeaveRequests,
  policies: acmePolicies,
  documents: acmeDocuments,
  candidates: acmeCandidates,
  requisitions: acmeRequisitions,
  onboardingTasks: acmeOnboarding,
  auditLog: acmeAudit,
  attendanceWeek: acmeAttendanceWeek,
  attendanceMix: acmeAttendanceMix,
  headcountTrend: acmeHeadcountTrend,
  headcountByDept: acmeHeadcountByDept,
  leaveByMonth: acmeLeaveByMonth,
})

const cache = new Map<string, CompanyData>()
export function getCompanyData(companyId: string): CompanyData {
  if (cache.has(companyId)) return cache.get(companyId)!
  const company = companies.find((c) => c.id === companyId) ?? companies[0]
  const data = company.id === 'c1' ? acmeData(company) : generate(company)
  cache.set(companyId, data)
  return data
}

/** Hook: returns the dataset for the currently-selected company. */
export function useCompanyData(): CompanyData {
  const { companyId } = useApp()
  return useMemo(() => getCompanyData(companyId), [companyId])
}
