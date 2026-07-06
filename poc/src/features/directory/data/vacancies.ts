/**
 * Internal vacancies surfaced alongside the directory (VAC-03/05).
 *
 * Each vacancy carries an explicit experience band (From/To years) so
 * employees can match openings to their seniority, plus enough descriptive
 * text (title, department, skills) for keyword search to be meaningful.
 */

export const VACANCY_STATUSES = ['Open', 'On Hold', 'Closing Soon'] as const
export type VacancyStatus = (typeof VACANCY_STATUSES)[number]

export interface Vacancy {
  id: string
  /** Human-readable requisition code. */
  code: string
  title: string
  department: string
  location: string
  employmentType: 'Full-time' | 'Contract'
  /** Minimum experience in years (VAC-05). */
  experienceFrom: number
  /** Maximum experience in years (VAC-05). */
  experienceTo: number
  openings: number
  skills: string[]
  postedOn: string
  status: VacancyStatus
}

export const seedVacancies: Vacancy[] = [
  {
    id: 'vac-01',
    code: 'REQ-2026-014',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    experienceFrom: 5,
    experienceTo: 9,
    openings: 2,
    skills: ['Node.js', 'PostgreSQL', 'AWS'],
    postedOn: '2026-06-02',
    status: 'Open',
  },
  {
    id: 'vac-02',
    code: 'REQ-2026-015',
    title: 'Frontend Engineer (React)',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceFrom: 2,
    experienceTo: 5,
    openings: 3,
    skills: ['React', 'TypeScript', 'Tailwind'],
    postedOn: '2026-06-05',
    status: 'Open',
  },
  {
    id: 'vac-03',
    code: 'REQ-2026-016',
    title: 'HR Business Partner',
    department: 'Human Resources',
    location: 'Chicago',
    employmentType: 'Full-time',
    experienceFrom: 6,
    experienceTo: 10,
    openings: 1,
    skills: ['Employee Relations', 'HRIS', 'Compliance'],
    postedOn: '2026-05-21',
    status: 'Closing Soon',
  },
  {
    id: 'vac-04',
    code: 'REQ-2026-017',
    title: 'QA Automation Analyst',
    department: 'Quality',
    location: 'Hyderabad',
    employmentType: 'Contract',
    experienceFrom: 1,
    experienceTo: 3,
    openings: 4,
    skills: ['Playwright', 'API Testing', 'CI/CD'],
    postedOn: '2026-06-12',
    status: 'Open',
  },
  {
    id: 'vac-05',
    code: 'REQ-2026-018',
    title: 'Payroll Specialist',
    department: 'Finance',
    location: 'Chicago',
    employmentType: 'Full-time',
    experienceFrom: 3,
    experienceTo: 6,
    openings: 1,
    skills: ['Payroll', 'US Tax', 'Acumatica'],
    postedOn: '2026-06-10',
    status: 'On Hold',
  },
  {
    id: 'vac-06',
    code: 'REQ-2026-019',
    title: 'Engineering Manager — Platform',
    department: 'Engineering',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    experienceFrom: 10,
    experienceTo: 15,
    openings: 1,
    skills: ['People Management', 'Distributed Systems', 'Roadmapping'],
    postedOn: '2026-05-28',
    status: 'Open',
  },
  {
    id: 'vac-07',
    code: 'REQ-2026-020',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceFrom: 4,
    experienceTo: 8,
    openings: 2,
    skills: ['Figma', 'Design Systems', 'Prototyping'],
    postedOn: '2026-06-18',
    status: 'Open',
  },
  {
    id: 'vac-08',
    code: 'REQ-2026-021',
    title: 'IT Support Associate',
    department: 'Operations',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    experienceFrom: 0,
    experienceTo: 2,
    openings: 2,
    skills: ['Helpdesk', 'Windows', 'Networking'],
    postedOn: '2026-06-20',
    status: 'Open',
  },
]
