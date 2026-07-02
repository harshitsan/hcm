/**
 * Directory & Org Chart — canonical seed data.
 *
 * Employees span three companies across two groups so that cross-company
 * search (DIR-09), portfolio oversight (DIR-12) and tenant scoping (DIR-16)
 * have real data to work against. Reporting relationships are effective-dated
 * (DIR-17) and non-user employees are first-class directory entries (DIR-13).
 */

export const EMPLOYMENT_STATUSES = [
  'active',
  'on-leave',
  'contractor',
  'inactive',
] as const
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]

export interface Company {
  id: string
  name: string
  code: string
  group: string
  portfolio: string
}

export const COMPANIES: Company[] = [
  {
    id: 'co-kensium',
    name: 'Kensium Solutions',
    code: 'KSL',
    group: 'Kensium Group',
    portfolio: 'Alandra Portfolio',
  },
  {
    id: 'co-klabs',
    name: 'Kensium Labs',
    code: 'KLB',
    group: 'Kensium Group',
    portfolio: 'Alandra Portfolio',
  },
  {
    id: 'co-northwind',
    name: 'Northwind Retail',
    code: 'NWR',
    group: 'Northwind Group',
    portfolio: 'Alandra Portfolio',
  },
]

export const CURRENT_COMPANY_ID = 'co-kensium'
export const CURRENT_GROUP = 'Kensium Group'
export const CURRENT_PORTFOLIO = 'Alandra Portfolio'

export interface Employee {
  id: string
  /** Human-readable employee ID, searchable in advanced search (DIR-06). */
  employeeCode: string
  name: string
  position: string
  department: string
  location: string
  workGroup: string
  companyId: string
  workEmail: string
  workPhone: string
  /** Sensitive by platform default — excluded from directory surfaces. */
  personalEmail: string
  /** Sensitive by platform default — excluded from directory surfaces. */
  salaryBand: string
  employmentStatus: EmploymentStatus
  /** Non-user employees still appear in directory + org chart (DIR-13). */
  isUser: boolean
  /** Currently effective manager (mirrors the latest reporting record). */
  managerId: string | null
  /** Values keyed by custom-field definition id (DIR-20/22). */
  customFields: Record<string, string>
}

export const seedEmployees: Employee[] = [
  {
    id: 'e-01',
    employeeCode: 'KSL-0001',
    name: 'Ananya Rao',
    position: 'Chief Executive Officer',
    department: 'Executive',
    location: 'Chennai HQ',
    workGroup: 'Leadership',
    companyId: 'co-kensium',
    workEmail: 'ananya.rao@kensium.com',
    workPhone: '+91 98410 20001',
    personalEmail: 'ananya.r@gmail.com',
    salaryBand: 'E1',
    employmentStatus: 'active',
    isUser: true,
    managerId: null,
    customFields: {
      'cf-skill': 'Leadership',
      'cf-desk': 'CH-4-01',
      'cf-shift': 'Flexible',
    },
  },
  {
    id: 'e-02',
    employeeCode: 'KSL-0002',
    name: 'Marcus Bell',
    position: 'VP of Engineering',
    department: 'Engineering',
    location: 'Chicago',
    workGroup: 'Leadership',
    companyId: 'co-kensium',
    workEmail: 'marcus.bell@kensium.com',
    workPhone: '+1 312 555 0102',
    personalEmail: 'mbell77@outlook.com',
    salaryBand: 'E2',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-01',
    customFields: {
      'cf-skill': 'Leadership',
      'cf-desk': 'CHI-2-08',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'e-03',
    employeeCode: 'KSL-0003',
    name: 'Priya Sharma',
    position: 'VP of Operations',
    department: 'Operations',
    location: 'Chennai HQ',
    workGroup: 'Leadership',
    companyId: 'co-kensium',
    workEmail: 'priya.sharma@kensium.com',
    workPhone: '+91 98410 20003',
    personalEmail: 'priya.sharma.blr@gmail.com',
    salaryBand: 'E2',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-01',
    customFields: {
      'cf-skill': 'Leadership',
      'cf-desk': 'CH-4-02',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-04',
    employeeCode: 'KSL-0004',
    name: 'Daniel Kim',
    position: 'Engineering Manager',
    department: 'Engineering',
    location: 'Chennai HQ',
    workGroup: 'Platform',
    companyId: 'co-kensium',
    workEmail: 'daniel.kim@kensium.com',
    workPhone: '+91 98410 20004',
    personalEmail: 'dkim.dev@gmail.com',
    salaryBand: 'M2',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-02',
    customFields: {
      'cf-skill': '.NET',
      'cf-desk': 'CH-3-11',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-05',
    employeeCode: 'KSL-0005',
    name: 'Elena Petrova',
    position: 'Engineering Manager',
    department: 'Engineering',
    location: 'Remote',
    workGroup: 'Delivery',
    companyId: 'co-kensium',
    workEmail: 'elena.petrova@kensium.com',
    workPhone: '+1 312 555 0105',
    personalEmail: 'elena.pv@proton.me',
    salaryBand: 'M2',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-02',
    customFields: {
      'cf-skill': 'React',
      'cf-desk': 'Remote',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'e-06',
    employeeCode: 'KSL-0006',
    name: 'Rohit Verma',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Hyderabad',
    workGroup: 'Platform',
    companyId: 'co-kensium',
    workEmail: 'rohit.verma@kensium.com',
    workPhone: '+91 98410 20006',
    personalEmail: 'rohit.v88@gmail.com',
    salaryBand: 'P4',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-04',
    customFields: {
      'cf-skill': 'Acumatica',
      'cf-desk': 'HYD-1-22',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-07',
    employeeCode: 'KSL-0007',
    name: 'Grace Osei',
    position: 'Software Engineer',
    department: 'Engineering',
    location: 'Remote',
    workGroup: 'Platform',
    companyId: 'co-kensium',
    workEmail: 'grace.osei@kensium.com',
    workPhone: '+1 312 555 0107',
    personalEmail: 'gosei.codes@gmail.com',
    salaryBand: 'P3',
    employmentStatus: 'on-leave',
    isUser: true,
    managerId: 'e-04',
    customFields: {
      'cf-skill': 'React',
      'cf-desk': 'Remote',
      'cf-shift': 'Flexible',
    },
  },
  {
    id: 'e-08',
    employeeCode: 'KSL-0008',
    name: "Liam O'Connor",
    position: 'Software Engineer',
    department: 'Engineering',
    location: 'Chicago',
    workGroup: 'Delivery',
    companyId: 'co-kensium',
    workEmail: 'liam.oconnor@kensium.com',
    workPhone: '+1 312 555 0108',
    personalEmail: 'liamoc@icloud.com',
    salaryBand: 'P3',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-05',
    customFields: {
      'cf-skill': '.NET',
      'cf-desk': 'CHI-2-14',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'e-09',
    employeeCode: 'KSL-0009',
    name: 'Mei Chen',
    position: 'QA Lead',
    department: 'Quality',
    location: 'Chennai HQ',
    workGroup: 'Quality',
    companyId: 'co-kensium',
    workEmail: 'mei.chen@kensium.com',
    workPhone: '+91 98410 20009',
    personalEmail: 'mei.chen.qa@gmail.com',
    salaryBand: 'P4',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-05',
    customFields: {
      'cf-skill': 'QA Automation',
      'cf-desk': 'CH-3-02',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-10',
    employeeCode: 'KSL-0010',
    name: 'Tomás Alvarez',
    position: 'HR Manager',
    department: 'Human Resources',
    location: 'Chennai HQ',
    workGroup: 'People',
    companyId: 'co-kensium',
    workEmail: 'tomas.alvarez@kensium.com',
    workPhone: '+91 98410 20010',
    personalEmail: 'talvarez.hr@gmail.com',
    salaryBand: 'M1',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-03',
    customFields: {
      'cf-skill': 'Recruiting',
      'cf-desk': 'CH-2-05',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-11',
    employeeCode: 'KSL-0011',
    name: 'Sara Haddad',
    position: 'HR Generalist',
    department: 'Human Resources',
    location: 'Chennai HQ',
    workGroup: 'People',
    companyId: 'co-kensium',
    workEmail: 'sara.haddad@kensium.com',
    workPhone: '+91 98410 20011',
    personalEmail: 'sara.haddad9@gmail.com',
    salaryBand: 'P2',
    employmentStatus: 'active',
    isUser: false,
    managerId: 'e-10',
    customFields: {
      'cf-skill': 'Recruiting',
      'cf-desk': 'CH-2-06',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-12',
    employeeCode: 'KSL-0012',
    name: 'Jack Nguyen',
    position: 'Facilities Coordinator',
    department: 'Operations',
    location: 'Chennai HQ',
    workGroup: 'People',
    companyId: 'co-kensium',
    workEmail: 'jack.nguyen@kensium.com',
    workPhone: '+91 98410 20012',
    personalEmail: 'jackn.chn@gmail.com',
    salaryBand: 'P1',
    employmentStatus: 'active',
    isUser: false,
    managerId: 'e-03',
    customFields: {
      'cf-skill': 'Facilities',
      'cf-desk': 'CH-1-01',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-13',
    employeeCode: 'KSL-0013',
    name: 'Nina Kowalski',
    position: 'Finance Manager',
    department: 'Finance',
    location: 'Chicago',
    workGroup: 'Finance Ops',
    companyId: 'co-kensium',
    workEmail: 'nina.kowalski@kensium.com',
    workPhone: '+1 312 555 0113',
    personalEmail: 'ninak.fin@outlook.com',
    salaryBand: 'M1',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-03',
    customFields: {
      'cf-skill': 'Accounting',
      'cf-desk': 'CHI-1-03',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'e-14',
    employeeCode: 'KSL-0014',
    name: 'Omar Farouk',
    position: 'Staff Accountant',
    department: 'Finance',
    location: 'Remote',
    workGroup: 'Finance Ops',
    companyId: 'co-kensium',
    workEmail: 'omar.farouk@kensium.com',
    workPhone: '+91 98410 20014',
    personalEmail: 'omarf.acct@gmail.com',
    salaryBand: 'C1',
    employmentStatus: 'contractor',
    isUser: true,
    managerId: 'e-13',
    customFields: {
      'cf-skill': 'Accounting',
      'cf-desk': 'Remote',
      'cf-shift': 'Flexible',
    },
  },
  {
    id: 'e-15',
    employeeCode: 'KSL-0015',
    name: 'Devon Marsh',
    position: 'Support Manager (deactivated)',
    department: 'Operations',
    location: 'Hyderabad',
    workGroup: 'Delivery',
    companyId: 'co-kensium',
    workEmail: 'devon.marsh@kensium.com',
    workPhone: '+91 98410 20015',
    personalEmail: 'devon.marsh@yahoo.com',
    salaryBand: 'M1',
    employmentStatus: 'inactive',
    isUser: false,
    managerId: 'e-03',
    customFields: {
      'cf-skill': 'Facilities',
      'cf-desk': 'HYD-1-01',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'e-16',
    employeeCode: 'KSL-0016',
    name: 'Hana Yusuf',
    position: 'Support Engineer',
    department: 'Operations',
    location: 'Hyderabad',
    workGroup: 'Delivery',
    companyId: 'co-kensium',
    workEmail: 'hana.yusuf@kensium.com',
    workPhone: '+91 98410 20016',
    personalEmail: 'hana.y@gmail.com',
    salaryBand: 'P2',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'e-15',
    customFields: {
      'cf-skill': 'Facilities',
      'cf-desk': 'HYD-1-02',
      'cf-shift': 'IST Day',
    },
  },
  // ── Kensium Labs (same group, different company) ─────────────────────────
  {
    id: 'l-01',
    employeeCode: 'KLB-0001',
    name: 'Isabelle Fontaine',
    position: 'Head of Labs',
    department: 'Research',
    location: 'Chicago',
    workGroup: 'Research',
    companyId: 'co-klabs',
    workEmail: 'isabelle.fontaine@kensiumlabs.com',
    workPhone: '+1 312 555 0201',
    personalEmail: 'isa.fontaine@gmail.com',
    salaryBand: 'E2',
    employmentStatus: 'active',
    isUser: true,
    managerId: null,
    customFields: {
      'cf-skill': 'Research',
      'cf-desk': 'CHI-3-01',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'l-02',
    employeeCode: 'KLB-0002',
    name: 'Arjun Mehta',
    position: 'Research Engineer',
    department: 'Research',
    location: 'Hyderabad',
    workGroup: 'Research',
    companyId: 'co-klabs',
    workEmail: 'arjun.mehta@kensiumlabs.com',
    workPhone: '+91 98410 30002',
    personalEmail: 'arjunm.ml@gmail.com',
    salaryBand: 'P4',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'l-01',
    customFields: {
      'cf-skill': 'Data Analytics',
      'cf-desk': 'HYD-2-08',
      'cf-shift': 'IST Day',
    },
  },
  {
    id: 'l-03',
    employeeCode: 'KLB-0003',
    name: 'Yuki Tanabe',
    position: 'Data Scientist',
    department: 'Research',
    location: 'Remote',
    workGroup: 'Research',
    companyId: 'co-klabs',
    workEmail: 'yuki.tanabe@kensiumlabs.com',
    workPhone: '+1 312 555 0203',
    personalEmail: 'yuki.tnb@icloud.com',
    salaryBand: 'P4',
    employmentStatus: 'active',
    isUser: false,
    managerId: 'l-01',
    customFields: {
      'cf-skill': 'Data Analytics',
      'cf-desk': 'Remote',
      'cf-shift': 'Flexible',
    },
  },
  // ── Northwind Retail (different group, same portfolio) ───────────────────
  {
    id: 'n-01',
    employeeCode: 'NWR-0001',
    name: 'Oliver Grant',
    position: 'Managing Director',
    department: 'Retail Operations',
    location: 'Chicago',
    workGroup: 'Retail',
    companyId: 'co-northwind',
    workEmail: 'oliver.grant@northwindretail.com',
    workPhone: '+1 312 555 0301',
    personalEmail: 'ogrant.chi@gmail.com',
    salaryBand: 'E1',
    employmentStatus: 'active',
    isUser: true,
    managerId: null,
    customFields: {
      'cf-skill': 'Retail Ops',
      'cf-desk': 'NW-5-01',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'n-02',
    employeeCode: 'NWR-0002',
    name: 'Fatima Zahra',
    position: 'Store Operations Lead',
    department: 'Retail Operations',
    location: 'Chicago',
    workGroup: 'Retail',
    companyId: 'co-northwind',
    workEmail: 'fatima.zahra@northwindretail.com',
    workPhone: '+1 312 555 0302',
    personalEmail: 'fzahra.ops@gmail.com',
    salaryBand: 'M1',
    employmentStatus: 'active',
    isUser: true,
    managerId: 'n-01',
    customFields: {
      'cf-skill': 'Retail Ops',
      'cf-desk': 'NW-4-11',
      'cf-shift': 'US Overlap',
    },
  },
  {
    id: 'n-03',
    employeeCode: 'NWR-0003',
    name: 'Sebastian Cruz',
    position: 'Merchandising Analyst',
    department: 'Retail Operations',
    location: 'Remote',
    workGroup: 'Retail',
    companyId: 'co-northwind',
    workEmail: 'sebastian.cruz@northwindretail.com',
    workPhone: '+1 312 555 0303',
    personalEmail: 'seb.cruz@outlook.com',
    salaryBand: 'P3',
    employmentStatus: 'active',
    isUser: false,
    managerId: 'n-02',
    customFields: {
      'cf-skill': 'Data Analytics',
      'cf-desk': 'Remote',
      'cf-shift': 'Flexible',
    },
  },
]

/**
 * Effective-dated reporting relationships (DIR-17). Only employees whose
 * manager changed over time carry history rows; everyone else's current
 * managerId is treated as effective since hire.
 */
export interface ReportingRecord {
  employeeId: string
  managerId: string | null
  effectiveFrom: string
  /** null = currently effective */
  effectiveTo: string | null
}

export const REPORTING_HISTORY: ReportingRecord[] = [
  {
    employeeId: 'e-08',
    managerId: 'e-04',
    effectiveFrom: '2024-01-15',
    effectiveTo: '2026-02-28',
  },
  {
    employeeId: 'e-08',
    managerId: 'e-05',
    effectiveFrom: '2026-03-01',
    effectiveTo: null,
  },
  {
    employeeId: 'e-09',
    managerId: 'e-04',
    effectiveFrom: '2023-06-01',
    effectiveTo: '2025-10-31',
  },
  {
    employeeId: 'e-09',
    managerId: 'e-05',
    effectiveFrom: '2025-11-01',
    effectiveTo: null,
  },
  {
    employeeId: 'e-13',
    managerId: 'e-01',
    effectiveFrom: '2022-04-01',
    effectiveTo: '2026-04-30',
  },
  {
    employeeId: 'e-13',
    managerId: 'e-03',
    effectiveFrom: '2026-05-01',
    effectiveTo: null,
  },
]

export function companyById(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id)
}
