import { type FileFormat } from './catalog'

/** Reusable source-column → target-field mapping template (DM-20 / DM-31). */
export interface MappingTemplate {
  id: string
  name: string
  module: string
  functionId: string
  functionName: string
  entity: string
  format: FileFormat
  /** source column header → target entity field */
  columnMap: Record<string, string>
  createdBy: string
  createdAt: string
}

export const seedMappings: MappingTemplate[] = [
  {
    id: 'map-01',
    name: 'ADP payroll extract → Employee Master',
    module: 'Employee',
    functionId: 'fn-employee',
    functionName: 'Employee Master',
    entity: 'Employee',
    format: 'CSV',
    columnMap: {
      emp_no: 'Employee Id',
      fname: 'First Name',
      lname: 'Last Name',
      dept_code: 'Department',
      doj: 'Joining Date',
      work_email: 'Email',
      shirt: 'T-Shirt Size',
    },
    createdBy: 'Dana Whitfield',
    createdAt: '2026-05-14',
  },
  {
    id: 'map-02',
    name: 'Legacy HRIS leave dump',
    module: 'Time Management',
    functionId: 'fn-leave-balance',
    functionName: 'Leave Balance',
    entity: 'Leaves',
    format: 'XLSX',
    columnMap: {
      employee_id: 'Employee Id',
      leave_code: 'Leave Type',
      bal: 'Balance',
      as_of: 'Effective From',
      cf_flag: 'Carry Forward',
    },
    createdBy: 'Dana Whitfield',
    createdAt: '2026-05-02',
  },
  {
    id: 'map-03',
    name: 'Biometric device attendance feed',
    module: 'Time Management',
    functionId: 'fn-attendance',
    functionName: 'Attendance Records',
    entity: 'Attendance',
    format: 'CSV',
    columnMap: {
      badge_id: 'Employee Id',
      punch_date: 'Date',
      in_time: 'Check In',
      out_time: 'Check Out',
      device: 'Source Device',
    },
    createdBy: 'Priya Nair',
    createdAt: '2026-04-21',
  },
  {
    id: 'map-04',
    name: 'Beacon org chart departments',
    module: 'Organization',
    functionId: 'fn-department',
    functionName: 'Department Master',
    entity: 'Department',
    format: 'JSON',
    columnMap: {
      code: 'Department Code',
      title: 'Department Name',
      company: 'Parent Company',
      cc: 'Cost Center',
    },
    createdBy: 'Theo Brooks',
    createdAt: '2026-03-30',
  },
]
