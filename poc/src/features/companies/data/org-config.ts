/**
 * Organization configuration surfaces migrated from Kensium HRMS
 * (Configuration → HR Budget Setup / Login Page Images / Thought of the day /
 * Vendor). All records live in in-memory stores seeded below.
 */

/* ------------------------------- HR Budget ------------------------------- */

export const BUDGET_CYCLES = ['Annual', 'Half-yearly', 'Quarterly'] as const
export type BudgetCycle = (typeof BUDGET_CYCLES)[number]

/** kx-060 "Setup" — HR budget planner module configuration. */
export interface BudgetPlannerConfig {
  /** Master switch — controls whether budget planning is available. */
  enabled: boolean
  cycle: BudgetCycle
  /** Warn HR admins when a department exceeds its planned headcount budget. */
  notifyOnOverrun: boolean
}

export const seedBudgetConfig: BudgetPlannerConfig = {
  enabled: false,
  cycle: 'Annual',
  notifyOnOverrun: true,
}

/* --------------------------- Login page images --------------------------- */

export const IMAGE_TYPES = ['Wallpapers', 'Logo', 'Login banner'] as const
export type ImageType = (typeof IMAGE_TYPES)[number]

export interface LoginImage {
  id: string
  name: string
  fileName: string
  type: ImageType
  sizeKb: number
  uploadedOn: string
  uploadedBy: string
}

export const seedLoginImages: LoginImage[] = [
  {
    id: 'img-001',
    name: 'Aurora skyline',
    fileName: 'aurora-skyline.jpg',
    type: 'Wallpapers',
    sizeKb: 842,
    uploadedOn: '2026-04-02',
    uploadedBy: 'priya.platform@satellitehr.com',
  },
  {
    id: 'img-002',
    name: 'Team huddle',
    fileName: 'team-huddle.png',
    type: 'Wallpapers',
    sizeKb: 1210,
    uploadedOn: '2026-05-11',
    uploadedBy: 'admin@bluegrainfoods.in',
  },
  {
    id: 'img-003',
    name: 'BlueGrain mark',
    fileName: 'bluegrain-logo.svg',
    type: 'Logo',
    sizeKb: 36,
    uploadedOn: '2026-03-19',
    uploadedBy: 'admin@bluegrainfoods.in',
  },
]

/* --------------------------- Thought of the day -------------------------- */

export const PUBLISH_TYPES = ['Sequential', 'Random'] as const
export type PublishType = (typeof PUBLISH_TYPES)[number]

export const TEXT_COLORS = [
  { value: '#1f2937', label: 'Charcoal' },
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#047857', label: 'Emerald' },
  { value: '#b91c1c', label: 'Crimson' },
  { value: '#7c3aed', label: 'Violet' },
] as const

export interface ThoughtSettings {
  /** Controls whether the thought of the day shows on employee dashboards. */
  enabled: boolean
  publishType: PublishType
  textColor: string
  /** Shown whenever no thought is scheduled — the display is never empty. */
  defaultText: string
}

export const seedThoughtSettings: ThoughtSettings = {
  enabled: true,
  publishType: 'Sequential',
  textColor: '#1d4ed8',
  defaultText: 'Make today count — small steps, big outcomes.',
}

export interface Thought {
  id: string
  text: string
  author: string
  addedOn: string
}

export const seedThoughts: Thought[] = [
  {
    id: 'tod-001',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    addedOn: '2026-05-04',
  },
  {
    id: 'tod-002',
    text: 'Quality means doing it right when no one is looking.',
    author: 'Henry Ford',
    addedOn: '2026-05-18',
  },
  {
    id: 'tod-003',
    text: 'Alone we can do so little; together we can do so much.',
    author: 'Helen Keller',
    addedOn: '2026-06-02',
  },
]

/* --------------------------------- Vendor -------------------------------- */

export const VENDOR_CATEGORIES = [
  'IT services',
  'Facilities',
  'Staffing',
  'Training',
  'Insurance',
] as const
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number]

export type VendorStatus = 'Active' | 'Inactive'

export interface Vendor {
  id: string
  name: string
  category: VendorCategory
  contactPerson: string
  email: string
  phone: string
  status: VendorStatus
}

export const seedVendors: Vendor[] = [
  {
    id: 'ven-001',
    name: 'Netlink IT Solutions',
    category: 'IT services',
    contactPerson: 'Ravi Shankar',
    email: 'ravi@netlinkit.in',
    phone: '+91 98450 22110',
    status: 'Active',
  },
  {
    id: 'ven-002',
    name: 'CityCare Facilities',
    category: 'Facilities',
    contactPerson: 'Meera Nair',
    email: 'meera@citycare.co.in',
    phone: '+91 99870 44521',
    status: 'Active',
  },
  {
    id: 'ven-003',
    name: 'TalentBridge Staffing',
    category: 'Staffing',
    contactPerson: 'Arjun Mehta',
    email: 'arjun@talentbridge.in',
    phone: '+91 90080 77653',
    status: 'Inactive',
  },
]
