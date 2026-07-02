/**
 * Employee records the Positions module assigns positions, classifications
 * and project roles to (POS-03, 10, 11, 17, 28, 32, 46). Includes both
 * portal users and non-user employees.
 */

export type EmployeeType = 'user' | 'non-user'

export interface ProjectRoleAssignment {
  projectId: string
  roleId: string
}

export interface Employee {
  id: string
  companyId: string
  /** Auto-generated from the Employee Code numbering series (POS-35). */
  code: string
  name: string
  type: EmployeeType
  /** Exactly one position at a time, or none yet (POS-03/11/17). */
  positionId: string | null
  classId: string | null
  projectAssignment: ProjectRoleAssignment | null
  /** Latest aggregate appraisal rating out of 5, if appraised (POS-41). */
  lastRating: number | null
}

/** The signed-in person when the role switcher says Employee (User). */
export const CURRENT_EMPLOYEE_ID = 'emp-priya'

export const seedEmployees: Employee[] = [
  { id: 'emp-priya', companyId: 'co-meridian', code: 'EMP-MER-0001', name: 'Priya Raman', type: 'user', positionId: 'POS-MER-0002', classId: 'ec-perm-sal', projectAssignment: { projectId: 'prj-2', roleId: 'pr-dev' }, lastRating: 4.2 },
  { id: 'emp-jordan', companyId: 'co-meridian', code: 'EMP-MER-0002', name: 'Jordan Blake', type: 'user', positionId: 'POS-MER-0004', classId: 'ec-perm-sal', projectAssignment: { projectId: 'prj-1', roleId: 'pr-lead' }, lastRating: 4.6 },
  { id: 'emp-mei', companyId: 'co-meridian', code: 'EMP-MER-0003', name: 'Mei Chen', type: 'user', positionId: 'POS-MER-0005', classId: 'ec-perm-hr', projectAssignment: { projectId: 'prj-1', roleId: 'pr-qa' }, lastRating: null },
  { id: 'emp-carlos', companyId: 'co-meridian', code: 'EMP-MER-0004', name: 'Carlos Vega', type: 'user', positionId: 'POS-MER-0001', classId: 'ec-contract', projectAssignment: { projectId: 'prj-3', roleId: 'pr-support' }, lastRating: 3.8 },
  { id: 'emp-anita', companyId: 'co-meridian', code: 'EMP-MER-0005', name: 'Anita Desai', type: 'user', positionId: 'POS-MER-0007', classId: 'ec-perm-sal', projectAssignment: null, lastRating: null },
  { id: 'emp-liam', companyId: 'co-meridian', code: 'EMP-MER-0006', name: 'Liam O’Connor', type: 'user', positionId: 'POS-MER-0010', classId: 'ec-perm-sal', projectAssignment: { projectId: 'prj-1', roleId: 'pr-dev' }, lastRating: 4.0 },
  { id: 'emp-sara', companyId: 'co-meridian', code: 'EMP-MER-0007', name: 'Sara Lindqvist', type: 'user', positionId: null, classId: null, projectAssignment: null, lastRating: null },
  { id: 'emp-tomas', companyId: 'co-meridian', code: 'EMP-MER-0008', name: 'Tomas Novak', type: 'user', positionId: 'POS-MER-0008', classId: 'ec-perm-sal', projectAssignment: { projectId: 'prj-4', roleId: 'pr-dev' }, lastRating: null },
  // Non-user employees — no portal login, still fully represented (POS-11/17).
  { id: 'emp-ravi', companyId: 'co-meridian', code: 'EMP-MER-0009', name: 'Ravi Kumar', type: 'non-user', positionId: 'POS-MER-0003', classId: 'ec-contract', projectAssignment: { projectId: 'prj-1', roleId: 'pr-dev' }, lastRating: 3.5 },
  { id: 'emp-gloria', companyId: 'co-meridian', code: 'EMP-MER-0010', name: 'Gloria Mensah', type: 'non-user', positionId: 'POS-MER-0006', classId: 'ec-parttime', projectAssignment: null, lastRating: null },
  { id: 'emp-hank', companyId: 'co-meridian', code: 'EMP-MER-0011', name: 'Hank Muller', type: 'non-user', positionId: null, classId: 'ec-perm-hr', projectAssignment: { projectId: 'prj-3', roleId: 'pr-bench' }, lastRating: null },
  // Other tenants, visible only via oversight scopes.
  { id: 'emp-bp-1', companyId: 'co-bluepeak', code: 'EMP-BLP-0001', name: 'Noor Haddad', type: 'user', positionId: 'POS-BLP-0001', classId: null, projectAssignment: null, lastRating: null },
  { id: 'emp-bp-2', companyId: 'co-bluepeak', code: 'EMP-BLP-0002', name: 'Felix Braun', type: 'user', positionId: 'POS-BLP-0002', classId: null, projectAssignment: null, lastRating: null },
  { id: 'emp-hl-1', companyId: 'co-harborline', code: 'EMP-HRB-0001', name: 'Wanda Osei', type: 'non-user', positionId: 'POS-HRB-0001', classId: null, projectAssignment: null, lastRating: null },
]

/**
 * Effective-dated employee↔position assignment history (POS-12/15).
 * Open entries have effectiveTo = null.
 */
export interface AssignmentHistoryEntry {
  id: string
  companyId: string
  employeeId: string
  positionId: string
  positionLabel: string
  effectiveFrom: string
  effectiveTo: string | null
  recordedAt: string
}

export const seedAssignmentHistory: AssignmentHistoryEntry[] = [
  { id: 'ah-1', companyId: 'co-meridian', employeeId: 'emp-priya', positionId: 'POS-MER-0001', positionLabel: 'Developer · Engineering · L1', effectiveFrom: '2025-03-01', effectiveTo: '2026-01-31', recordedAt: '2025-03-01 09:00' },
  { id: 'ah-2', companyId: 'co-meridian', employeeId: 'emp-priya', positionId: 'POS-MER-0002', positionLabel: 'Developer · Engineering · L2', effectiveFrom: '2026-02-01', effectiveTo: null, recordedAt: '2026-01-20 15:45' },
  { id: 'ah-3', companyId: 'co-meridian', employeeId: 'emp-jordan', positionId: 'POS-MER-0002', positionLabel: 'Developer · Engineering · L2', effectiveFrom: '2025-02-20', effectiveTo: '2025-10-31', recordedAt: '2025-02-20 09:30' },
  { id: 'ah-4', companyId: 'co-meridian', employeeId: 'emp-jordan', positionId: 'POS-MER-0004', positionLabel: 'Tech Lead · Engineering · L3', effectiveFrom: '2025-11-01', effectiveTo: null, recordedAt: '2025-10-25 11:10' },
  { id: 'ah-5', companyId: 'co-meridian', employeeId: 'emp-mei', positionId: 'POS-MER-0005', positionLabel: 'QA Analyst · Quality Assurance · L1', effectiveFrom: '2025-04-01', effectiveTo: null, recordedAt: '2025-04-01 10:00' },
  { id: 'ah-6', companyId: 'co-meridian', employeeId: 'emp-carlos', positionId: 'POS-MER-0001', positionLabel: 'Developer · Engineering · L1', effectiveFrom: '2025-06-15', effectiveTo: null, recordedAt: '2025-06-15 09:15' },
  { id: 'ah-7', companyId: 'co-meridian', employeeId: 'emp-ravi', positionId: 'POS-MER-0003', positionLabel: 'Developer · Acumatica Practice · L1', effectiveFrom: '2025-07-01', effectiveTo: null, recordedAt: '2025-07-01 08:50' },
  { id: 'ah-8', companyId: 'co-meridian', employeeId: 'emp-anita', positionId: 'POS-MER-0007', positionLabel: 'HR Generalist · Human Resources · L1', effectiveFrom: '2025-05-01', effectiveTo: null, recordedAt: '2025-05-01 09:00' },
  { id: 'ah-9', companyId: 'co-meridian', employeeId: 'emp-liam', positionId: 'POS-MER-0010', positionLabel: 'Acumatica Consultant · Acumatica Practice · L2', effectiveFrom: '2025-08-01', effectiveTo: null, recordedAt: '2025-08-01 09:00' },
  { id: 'ah-10', companyId: 'co-meridian', employeeId: 'emp-tomas', positionId: 'POS-MER-0008', positionLabel: 'Payroll Specialist · Finance · L2', effectiveFrom: '2025-09-01', effectiveTo: null, recordedAt: '2025-09-01 09:00' },
  { id: 'ah-11', companyId: 'co-meridian', employeeId: 'emp-gloria', positionId: 'POS-MER-0006', positionLabel: 'QA Automation Engineer · Quality Assurance · L2', effectiveFrom: '2025-10-01', effectiveTo: null, recordedAt: '2025-10-01 09:00' },
]
