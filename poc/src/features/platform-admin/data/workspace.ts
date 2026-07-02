/**
 * Platform Administration — employee workspace domain (SYS-18, 19, 27, 72,
 * 73). Tenant-aware global search records (including custom fields),
 * recently viewed items, the self-service snapshot and interview panels.
 */

export const SEARCH_KINDS = ['Employee', 'Candidate', 'Document'] as const
export type SearchKind = (typeof SEARCH_KINDS)[number]

export interface SearchRecord {
  id: string
  kind: SearchKind
  title: string
  subtitle: string
  /** Searchable custom-field values (SYS-33, 73). */
  customFields: Record<string, string>
}

export interface SelfProfile {
  name: string
  email: string
  phone: string
  address: string
}

export interface Announcement {
  id: string
  title: string
  postedOn: string
}

export interface MyDocument {
  id: string
  name: string
  category: string
}

export const PANEL_STATUSES = [
  'scheduled',
  'feedback due',
  'completed',
] as const
export type PanelStatus = (typeof PANEL_STATUSES)[number]

export interface InterviewPanel {
  id: string
  candidate: string
  role: string
  interviewAt: string
  status: PanelStatus
  /** Candidate converted to an employee record after selection (SYS-19). */
  converted: boolean
}

export const seedSearchRecords: SearchRecord[] = [
  { id: 'sr-01', kind: 'Employee', title: 'Arjun Pillai', subtitle: 'Senior Engineer — Product Engineering', customFields: { 'PF / UAN number': 'UAN-100223344556' } },
  { id: 'sr-02', kind: 'Employee', title: 'Kavya Raman', subtitle: 'HR Manager — Human Resources', customFields: { 'PF / UAN number': 'UAN-100998877665' } },
  { id: 'sr-03', kind: 'Employee', title: 'Sana Kulkarni', subtitle: 'IT Security Lead — Engineering', customFields: {} },
  { id: 'sr-04', kind: 'Candidate', title: 'Diya Menon', subtitle: 'Candidate — Mobile Engineer', customFields: { 'Visa status': 'Citizen' } },
  { id: 'sr-05', kind: 'Candidate', title: 'Rohan Iyer', subtitle: 'Candidate — SRE Lead', customFields: { 'Visa status': 'H1B (US entity)' } },
  { id: 'sr-06', kind: 'Document', title: 'POSH policy 2026.pdf', subtitle: 'Company policies', customFields: {} },
  { id: 'sr-07', kind: 'Document', title: 'Offer letter — Diya Menon.docx', subtitle: 'Talent acquisition', customFields: {} },
  { id: 'sr-08', kind: 'Document', title: 'Holiday calendar 2026.xlsx', subtitle: 'Announcements', customFields: {} },
  { id: 'sr-09', kind: 'Employee', title: 'Ravi Annamalai', subtitle: 'Loom Operator — Operations', customFields: {} },
]

export const seedRecentlyViewed: SearchRecord[] = [
  seedSearchRecords[1],
  seedSearchRecords[5],
  seedSearchRecords[3],
]

export const seedSelfProfile: SelfProfile = {
  name: 'Arjun Pillai',
  email: 'arjun.pillai@aster.example',
  phone: '+91 98450 12345',
  address: '221 HSR Layout, Bengaluru 560102',
}

export const seedAnnouncements: Announcement[] = [
  { id: 'ann-01', title: 'Annual performance cycle opens 1 July', postedOn: '2026-06-24' },
  { id: 'ann-02', title: 'New group medical insurance partner', postedOn: '2026-06-18' },
  { id: 'ann-03', title: 'Whitefield campus parking changes', postedOn: '2026-06-10' },
]

export const seedMyDocuments: MyDocument[] = [
  { id: 'doc-01', name: 'Employment contract.pdf', category: 'Contract' },
  { id: 'doc-02', name: 'Form 16 — FY 2025-26.pdf', category: 'Tax' },
  { id: 'doc-03', name: 'Appraisal letter 2026.pdf', category: 'Compensation' },
]

export const seedPanels: InterviewPanel[] = [
  { id: 'pan-01', candidate: 'Diya Menon', role: 'Mobile Engineer', interviewAt: '2026-06-30 11:00', status: 'scheduled', converted: false },
  { id: 'pan-02', candidate: 'Rohan Iyer', role: 'SRE Lead', interviewAt: '2026-06-25 15:00', status: 'feedback due', converted: false },
  { id: 'pan-03', candidate: 'Neha Chopra', role: 'Payroll Analyst', interviewAt: '2026-06-12 10:00', status: 'completed', converted: true },
]
