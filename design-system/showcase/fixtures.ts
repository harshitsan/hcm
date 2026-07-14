export type CompanyStatus = 'Active' | 'Draft' | 'Suspended' | 'Inactive'
export type Subscription = 'Basic' | 'Standard' | 'Enterprise'

export interface Company {
  id: string
  name: string
  code: string
  jurisdiction: string
  status: CompanyStatus
  subscription: Subscription
  employeesUsed: number
  employeeLimit: number
  people: string[]
}

export const companies: Company[] = [
  {
    id: 'comp-1',
    name: 'Bluegrain Foods Private Limited',
    code: 'COMP-2024-0001',
    jurisdiction: 'India',
    status: 'Active',
    subscription: 'Standard',
    employeesUsed: 431,
    employeeLimit: 500,
    people: ['Aarav Shah', 'Neha Kapoor', 'Rohan Mehta', 'Ishita Rao'],
  },
  {
    id: 'comp-2',
    name: 'Northwind Logistics FZE',
    code: 'COMP-2024-0002',
    jurisdiction: 'UAE',
    status: 'Active',
    subscription: 'Enterprise',
    employeesUsed: 812,
    employeeLimit: 1000,
    people: ['Omar Haddad', 'Lina Farouk', 'Sara Ali'],
  },
  {
    id: 'comp-3',
    name: 'Meridian Health Systems',
    code: 'COMP-2024-0003',
    jurisdiction: 'United States',
    status: 'Draft',
    subscription: 'Basic',
    employeesUsed: 18,
    employeeLimit: 100,
    people: ['Emily Carter', 'Jason Wu'],
  },
  {
    id: 'comp-4',
    name: 'Solstice Renewables GmbH',
    code: 'COMP-2024-0004',
    jurisdiction: 'Germany',
    status: 'Active',
    subscription: 'Standard',
    employeesUsed: 264,
    employeeLimit: 400,
    people: ['Lena Fischer', 'Max Bauer', 'Anja Klein', 'Tom Richter'],
  },
  {
    id: 'comp-5',
    name: 'Kestrel Aerospace Holdings',
    code: 'COMP-2024-0005',
    jurisdiction: 'United Kingdom',
    status: 'Suspended',
    subscription: 'Enterprise',
    employeesUsed: 95,
    employeeLimit: 900,
    people: ['Oliver Grant', 'Freya Wood'],
  },
  {
    id: 'comp-6',
    name: 'Sagano Precision Robotics',
    code: 'COMP-2024-0006',
    jurisdiction: 'Japan',
    status: 'Active',
    subscription: 'Enterprise',
    employeesUsed: 671,
    employeeLimit: 750,
    people: ['Haruto Sato', 'Yui Tanaka', 'Kenji Ito', 'Aoi Suzuki'],
  },
  {
    id: 'comp-7',
    name: 'Cabo Verde Trading Co.',
    code: 'COMP-2024-0007',
    jurisdiction: 'Portugal',
    status: 'Inactive',
    subscription: 'Basic',
    employeesUsed: 6,
    employeeLimit: 50,
    people: ['Mariana Silva'],
  },
  {
    id: 'comp-8',
    name: 'Highland Grain Cooperative',
    code: 'COMP-2024-0008',
    jurisdiction: 'Canada',
    status: 'Draft',
    subscription: 'Standard',
    employeesUsed: 47,
    employeeLimit: 300,
    people: ['Liam Fraser', 'Chloe MacDonald', 'Noah Campbell'],
  },
]

export const companyStats = [
  { label: 'Total companies', value: companies.length },
  { label: 'Active', value: companies.filter((c) => c.status === 'Active').length },
  { label: 'Draft', value: companies.filter((c) => c.status === 'Draft').length },
  { label: 'Suspended', value: companies.filter((c) => c.status === 'Suspended').length },
]
