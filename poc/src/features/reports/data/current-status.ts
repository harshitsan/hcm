import { type Company } from './report-catalog'

export const CURRENT_STATUSES = [
  'Available',
  'On Leave',
  'On Site',
  'Work From Home',
  'In Meeting',
] as const

export type CurrentStatus = (typeof CURRENT_STATUSES)[number]

/** Real-time availability row for the Employee Current Status screen (RPT-44). */
export interface EmployeeStatusRow {
  id: string
  name: string
  company: Company
  location: string
  department: string
  project: string
  positionLevel: string
  status: CurrentStatus
}

const s = (
  id: string,
  name: string,
  company: Company,
  location: string,
  department: string,
  project: string,
  positionLevel: string,
  status: CurrentStatus
): EmployeeStatusRow => ({
  id,
  name,
  company,
  location,
  department,
  project,
  positionLevel,
  status,
})

export const seedCurrentStatus: EmployeeStatusRow[] = [
  s(
    'cs-01',
    'Ananya Rao',
    'Aurora Software',
    'Hyderabad',
    'Engineering',
    'Atlas',
    'Senior Engineer',
    'Available'
  ),
  s(
    'cs-02',
    'Vikram Shetty',
    'Aurora Software',
    'Bengaluru',
    'Sales',
    'Storefront Pitch',
    'Account Manager',
    'On Site'
  ),
  s(
    'cs-03',
    'Karthik Reddy',
    'Aurora Software',
    'Hyderabad',
    'Engineering',
    'Bench',
    'Engineer',
    'Available'
  ),
  s(
    'cs-04',
    'Lakshmi Pillai',
    'Aurora Software',
    'Chennai',
    'Human Resources',
    'HR Ops',
    'HR Executive',
    'In Meeting'
  ),
  s(
    'cs-05',
    'Suresh Babu',
    'Aurora Software',
    'Chennai',
    'Operations',
    'Facilities',
    'Coordinator',
    'On Leave'
  ),
  s(
    'cs-06',
    'Ravi Menon',
    'Aurora Software',
    'Hyderabad',
    'Engineering',
    'Atlas',
    'VP Engineering',
    'In Meeting'
  ),
  s(
    'cs-07',
    'Deepa Nair',
    'Aurora Software',
    'Remote',
    'Engineering',
    'Atlas',
    'Engineer',
    'Work From Home'
  ),
  s(
    'cs-08',
    'Meera Iyer',
    'Northwind Retail',
    'Chennai',
    'Operations',
    'Storefront',
    'Supervisor',
    'Available'
  ),
  s(
    'cs-09',
    'Priyanka Das',
    'Northwind Retail',
    'Bengaluru',
    'Sales',
    'Storefront',
    'Store Manager',
    'On Site'
  ),
  s(
    'cs-10',
    'Rakesh Kumar',
    'Northwind Retail',
    'Chennai',
    'Operations',
    'Storefront',
    'Associate',
    'On Leave'
  ),
  s(
    'cs-11',
    'Daniel Chen',
    'Zenith Manufacturing',
    'Hyderabad',
    'Engineering',
    'Forge',
    'Lead Engineer',
    'Available'
  ),
  s(
    'cs-12',
    'Sanjay Ghosh',
    'Zenith Manufacturing',
    'Chennai',
    'Operations',
    'Forge',
    'Technician',
    'On Site'
  ),
  s(
    'cs-13',
    'Anita Borkar',
    'Zenith Manufacturing',
    'Chennai',
    'Operations',
    'Forge',
    'Technician',
    'Available'
  ),
  s(
    'cs-14',
    'Fatima Khan',
    'Helios Energy',
    'Remote',
    'Finance',
    'Ledger',
    'Finance Controller',
    'Work From Home'
  ),
  s(
    'cs-15',
    'Neha Kulkarni',
    'Helios Energy',
    'Bengaluru',
    'Finance',
    'Ledger',
    'Analyst',
    'On Leave'
  ),
]
