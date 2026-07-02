export const USER_ROLES = [
  'Admin',
  'Property Manager',
  'Leasing Agent',
  'Maintenance',
  'Accountant',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = ['active', 'invited', 'suspended'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const COMMUNITIES = [
  'All communities',
  'Maple Court',
  'Riverside Lofts',
  'The Hawthorne',
  'Cedar Park',
  'Lakeview Terrace',
  'Brookstone Flats',
] as const

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  community: string
  status: UserStatus
  /** ISO date of last sign-in, or null if the invite is still pending. */
  lastActive: string | null
}

export const seedUsers: User[] = [
  {
    id: 'u-1001',
    name: 'Dana Whitfield',
    email: 'dana.whitfield@mlsapartments.com',
    role: 'Admin',
    community: 'All communities',
    status: 'active',
    lastActive: '2026-06-17',
  },
  {
    id: 'u-1002',
    name: 'Marcus Lane',
    email: 'marcus.lane@mlsapartments.com',
    role: 'Property Manager',
    community: 'Maple Court',
    status: 'active',
    lastActive: '2026-06-18',
  },
  {
    id: 'u-1003',
    name: 'Priya Nair',
    email: 'priya.nair@mlsapartments.com',
    role: 'Leasing Agent',
    community: 'Riverside Lofts',
    status: 'active',
    lastActive: '2026-06-16',
  },
  {
    id: 'u-1004',
    name: 'Theo Brooks',
    email: 'theo.brooks@mlsapartments.com',
    role: 'Maintenance',
    community: 'The Hawthorne',
    status: 'active',
    lastActive: '2026-06-15',
  },
  {
    id: 'u-1005',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@mlsapartments.com',
    role: 'Accountant',
    community: 'All communities',
    status: 'active',
    lastActive: '2026-06-12',
  },
  {
    id: 'u-1006',
    name: 'Sofia Reyes',
    email: 'sofia.reyes@mlsapartments.com',
    role: 'Leasing Agent',
    community: 'Cedar Park',
    status: 'invited',
    lastActive: null,
  },
  {
    id: 'u-1007',
    name: 'Owen Clarke',
    email: 'owen.clarke@mlsapartments.com',
    role: 'Property Manager',
    community: 'Lakeview Terrace',
    status: 'suspended',
    lastActive: '2026-05-29',
  },
  {
    id: 'u-1008',
    name: 'Amara Okafor',
    email: 'amara.okafor@mlsapartments.com',
    role: 'Leasing Agent',
    community: 'Brookstone Flats',
    status: 'active',
    lastActive: '2026-06-18',
  },
]
