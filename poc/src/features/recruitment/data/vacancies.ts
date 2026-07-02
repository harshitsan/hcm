/** Vacancy lifecycle distinct from the parent requisition (TA-34). */
export const VACANCY_STATUSES = [
  'new',
  'assigned',
  'in-process',
  'closed',
  'withdrawn',
] as const
export type VacancyStatus = (typeof VACANCY_STATUSES)[number]

export interface Vacancy {
  id: string
  code: string
  rrfId: string
  position: string
  workLocation: string
  employeeClass: string
  vacancies: number
  createdDate: string
  closingDate: string
  recruiters: string[]
  status: VacancyStatus
}

export const POSTING_MODES = ['Internal', 'External', 'Both'] as const
export type PostingMode = (typeof POSTING_MODES)[number]

export const POSTING_STATUSES = [
  'pending-approval',
  'approved',
  'live',
  'rejected',
] as const
export type PostingStatus = (typeof POSTING_STATUSES)[number]

/** A vacancy advertised on a posting channel (TA-36, TA-38). */
export interface Posting {
  id: string
  vacancyCode: string
  position: string
  department: string
  channelId: string
  channelName: string
  source: string
  positionLevel: string
  workLocation: string
  employeeClass: string
  vacancies: number
  postingMode: PostingMode
  createdDate: string
  status: PostingStatus
  approver?: string
  decidedAt?: string
}

export const POSITION_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const

export const seedVacancies: Vacancy[] = [
  {
    id: 'v-01',
    code: 'VAC-2201',
    rrfId: 'RRF-1001',
    position: 'Senior Backend Engineer',
    workLocation: 'Bengaluru',
    employeeClass: 'Full-time',
    vacancies: 2,
    createdDate: '2026-05-16',
    closingDate: '2026-07-31',
    recruiters: ['Meera Iyer'],
    status: 'in-process',
  },
  {
    id: 'v-02',
    code: 'VAC-2202',
    rrfId: 'RRF-1005',
    position: 'Sales Development Rep',
    workLocation: 'Remote — India',
    employeeClass: 'Contract',
    vacancies: 4,
    createdDate: '2026-05-27',
    closingDate: '2026-07-10',
    recruiters: ['Sana Qureshi'],
    status: 'assigned',
  },
  {
    id: 'v-03',
    code: 'VAC-2203',
    rrfId: 'RRF-1004',
    position: 'Customer Support Lead',
    workLocation: 'Hyderabad',
    employeeClass: 'Full-time',
    vacancies: 1,
    createdDate: '2026-06-06',
    closingDate: '2026-07-20',
    recruiters: [],
    status: 'new',
  },
  {
    id: 'v-04',
    code: 'VAC-2204',
    rrfId: 'RRF-1008',
    position: 'QA Automation Engineer',
    workLocation: 'Pune',
    employeeClass: 'Full-time',
    vacancies: 2,
    createdDate: '2026-03-18',
    closingDate: '2026-05-31',
    recruiters: ['Meera Iyer'],
    status: 'closed',
  },
  {
    id: 'v-05',
    code: 'VAC-2205',
    rrfId: 'RRF-1010',
    position: 'DevOps Engineer',
    workLocation: 'Remote — India',
    employeeClass: 'Full-time',
    vacancies: 1,
    createdDate: '2026-05-07',
    closingDate: '2026-06-30',
    recruiters: ['Rahul Verma'],
    status: 'withdrawn',
  },
  {
    id: 'v-06',
    code: 'VAC-2206',
    rrfId: 'RRF-1007',
    position: 'Data Engineer',
    workLocation: 'Hyderabad',
    employeeClass: 'Full-time',
    vacancies: 1,
    createdDate: '2026-05-02',
    closingDate: '2026-08-30',
    recruiters: ['Vikram Joshi'],
    status: 'in-process',
  },
]

export const seedPostings: Posting[] = [
  {
    id: 'p-01',
    vacancyCode: 'VAC-2201',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    channelId: 'ch-01',
    channelName: 'LinkedIn Jobs',
    source: 'LinkedIn',
    positionLevel: 'Senior',
    workLocation: 'Bengaluru',
    employeeClass: 'Full-time',
    vacancies: 2,
    postingMode: 'External',
    createdDate: '2026-05-18',
    status: 'live',
    approver: 'Sunita Patil',
    decidedAt: '2026-05-18',
  },
  {
    id: 'p-02',
    vacancyCode: 'VAC-2202',
    position: 'Sales Development Rep',
    department: 'Sales',
    channelId: 'ch-03',
    channelName: 'Company Careers Site',
    source: 'Career Site',
    positionLevel: 'Junior',
    workLocation: 'Remote — India',
    employeeClass: 'Contract',
    vacancies: 4,
    postingMode: 'Both',
    createdDate: '2026-05-29',
    status: 'pending-approval',
  },
  {
    id: 'p-03',
    vacancyCode: 'VAC-2206',
    position: 'Data Engineer',
    department: 'Engineering',
    channelId: 'ch-02',
    channelName: 'Naukri',
    source: 'Naukri',
    positionLevel: 'Mid',
    workLocation: 'Hyderabad',
    employeeClass: 'Full-time',
    vacancies: 1,
    postingMode: 'External',
    createdDate: '2026-05-10',
    status: 'approved',
    approver: 'Sunita Patil',
    decidedAt: '2026-05-11',
  },
]
