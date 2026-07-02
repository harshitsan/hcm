import { type Company } from './report-catalog'

/**
 * Flat, typed record set the ad hoc builder reports over (RPT-06, RPT-07).
 * Includes tenant custom/UDF values so the metadata-driven field catalog can
 * expose them (RPT-23).
 */
export interface AdhocRecord {
  id: string
  employee: string
  company: Company
  department: string
  location: string
  gender: 'Male' | 'Female'
  status: 'Active' | 'On Notice' | 'Exited'
  grade: string
  leaveBalance: number
  attendancePct: number
  /** Custom/UDF field configured for the tenant. */
  costCenter: string
  /** Custom/UDF field configured for the tenant. */
  tshirtSize: string
  /** Deprecated field hidden via config (RPT-23). */
  bloodGroup: string
}

export type AdhocFieldKey = Exclude<keyof AdhocRecord, 'id' | 'company'>

/** Metadata-schema entry driving the builder's selectable field list. */
export interface FieldDef {
  key: AdhocFieldKey
  label: string
  source: 'standard' | 'custom'
  /** Hidden/deprecated fields never appear in the builder (RPT-23). */
  visible: boolean
}

export const seedFieldCatalog: FieldDef[] = [
  { key: 'employee', label: 'Employee', source: 'standard', visible: true },
  { key: 'department', label: 'Department', source: 'standard', visible: true },
  { key: 'location', label: 'Location', source: 'standard', visible: true },
  { key: 'gender', label: 'Gender', source: 'standard', visible: true },
  {
    key: 'status',
    label: 'Employment Status',
    source: 'standard',
    visible: true,
  },
  { key: 'grade', label: 'Grade', source: 'standard', visible: true },
  {
    key: 'leaveBalance',
    label: 'Leave Balance',
    source: 'standard',
    visible: true,
  },
  {
    key: 'attendancePct',
    label: 'Attendance %',
    source: 'standard',
    visible: true,
  },
  {
    key: 'costCenter',
    label: 'Cost Center (UDF)',
    source: 'custom',
    visible: true,
  },
  {
    key: 'tshirtSize',
    label: 'T-Shirt Size (UDF)',
    source: 'custom',
    visible: true,
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group (deprecated)',
    source: 'custom',
    visible: false,
  },
]

const a = (
  id: string,
  employee: string,
  company: Company,
  department: string,
  location: string,
  gender: AdhocRecord['gender'],
  status: AdhocRecord['status'],
  grade: string,
  leaveBalance: number,
  attendancePct: number,
  costCenter: string,
  tshirtSize: string,
  bloodGroup: string
): AdhocRecord => ({
  id,
  employee,
  company,
  department,
  location,
  gender,
  status,
  grade,
  leaveBalance,
  attendancePct,
  costCenter,
  tshirtSize,
  bloodGroup,
})

export const adhocRecords: AdhocRecord[] = [
  a(
    'ar-01',
    'Ananya Rao',
    'Aurora Software',
    'Engineering',
    'Hyderabad',
    'Female',
    'Active',
    'L4',
    11.5,
    95,
    'CC-ENG-01',
    'M',
    'O+'
  ),
  a(
    'ar-02',
    'Vikram Shetty',
    'Aurora Software',
    'Sales',
    'Bengaluru',
    'Male',
    'Active',
    'L3',
    6,
    77,
    'CC-SAL-02',
    'L',
    'B+'
  ),
  a(
    'ar-03',
    'Karthik Reddy',
    'Aurora Software',
    'Engineering',
    'Hyderabad',
    'Male',
    'Active',
    'L3',
    9,
    100,
    'CC-ENG-01',
    'XL',
    'A+'
  ),
  a(
    'ar-04',
    'Lakshmi Pillai',
    'Aurora Software',
    'Human Resources',
    'Chennai',
    'Female',
    'Active',
    'L2',
    12,
    100,
    'CC-HR-01',
    'S',
    'O-'
  ),
  a(
    'ar-05',
    'Rohit Verma',
    'Aurora Software',
    'Engineering',
    'Remote',
    'Male',
    'Exited',
    'L4',
    0,
    88,
    'CC-ENG-02',
    'M',
    'AB+'
  ),
  a(
    'ar-06',
    'Suresh Babu',
    'Aurora Software',
    'Operations',
    'Chennai',
    'Male',
    'Active',
    'L1',
    8,
    91,
    'CC-OPS-01',
    'L',
    'B-'
  ),
  a(
    'ar-07',
    'Meera Iyer',
    'Northwind Retail',
    'Operations',
    'Chennai',
    'Female',
    'Active',
    'L2',
    14,
    100,
    'CC-OPS-11',
    'M',
    'O+'
  ),
  a(
    'ar-08',
    'Priyanka Das',
    'Northwind Retail',
    'Sales',
    'Bengaluru',
    'Female',
    'Active',
    'L2',
    10,
    95,
    'CC-SAL-11',
    'S',
    'A-'
  ),
  a(
    'ar-09',
    'Rakesh Kumar',
    'Northwind Retail',
    'Operations',
    'Chennai',
    'Male',
    'On Notice',
    'L1',
    2,
    86,
    'CC-OPS-11',
    'XL',
    'B+'
  ),
  a(
    'ar-10',
    'Daniel Chen',
    'Zenith Manufacturing',
    'Engineering',
    'Hyderabad',
    'Male',
    'Active',
    'L5',
    6,
    91,
    'CC-ENG-21',
    'L',
    'O+'
  ),
  a(
    'ar-11',
    'Sanjay Ghosh',
    'Zenith Manufacturing',
    'Operations',
    'Chennai',
    'Male',
    'Active',
    'L2',
    9,
    100,
    'CC-OPS-21',
    'M',
    'A+'
  ),
  a(
    'ar-12',
    'Anita Borkar',
    'Zenith Manufacturing',
    'Operations',
    'Chennai',
    'Female',
    'Active',
    'L2',
    7,
    95,
    'CC-OPS-21',
    'M',
    'B+'
  ),
  a(
    'ar-13',
    'Fatima Khan',
    'Helios Energy',
    'Finance',
    'Remote',
    'Female',
    'Active',
    'L4',
    13,
    100,
    'CC-FIN-31',
    'S',
    'O+'
  ),
  a(
    'ar-14',
    'Neha Kulkarni',
    'Helios Energy',
    'Finance',
    'Bengaluru',
    'Female',
    'On Notice',
    'L3',
    4,
    82,
    'CC-FIN-31',
    'M',
    'A+'
  ),
]

export const GROUPING_OPTIONS = [
  'none',
  'department',
  'location',
  'status',
  'costCenter',
] as const

export type GroupingKey = (typeof GROUPING_OPTIONS)[number]

/** Saved ad hoc report view configuration (RPT-08). */
export interface SavedView {
  id: string
  name: string
  fields: AdhocFieldKey[]
  departmentFilter: string
  statusFilter: string
  groupBy: GroupingKey
  updatedOn: string
}

export const seedSavedViews: SavedView[] = [
  {
    id: 'sv-01',
    name: 'Engineering leave check',
    fields: ['employee', 'department', 'grade', 'leaveBalance'],
    departmentFilter: 'Engineering',
    statusFilter: 'all',
    groupBy: 'none',
    updatedOn: '2026-06-20',
  },
  {
    id: 'sv-02',
    name: 'Headcount by cost center',
    fields: ['employee', 'department', 'costCenter', 'status'],
    departmentFilter: 'all',
    statusFilter: 'Active',
    groupBy: 'costCenter',
    updatedOn: '2026-06-11',
  },
]
