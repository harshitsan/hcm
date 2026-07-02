export interface Employee {
  id: string
  name: string
  title: string
  companyId: string
  /** Every employee must belong to at least one department (DEPT-05). */
  departmentIds: string[]
  /** False = Employee (Non-User): represented without portal access (DEPT-12). */
  isPortalUser: boolean
  /** Specific shift overriding the department default, if any (DEPT-34). */
  shiftId: string | null
}

/** The employee shown in the "My Departments" self-service view. */
export const CURRENT_EMPLOYEE_ID = 'emp-09'

export const seedEmployees: Employee[] = [
  {
    id: 'emp-01',
    name: 'Aarav Mehta',
    title: 'Chief Human Resources Officer',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0002'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-02',
    name: 'Neha Kulkarni',
    title: 'HR Manager',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0002', 'DEP-0003'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-03',
    name: 'Rohan Iyer',
    title: 'Senior Recruiter',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0003'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-04',
    name: 'Sana Qureshi',
    title: 'Payroll Lead',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0004'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-05',
    name: 'Vikram Rao',
    title: 'Chief Financial Officer',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0001', 'DEP-0005'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-06',
    name: 'Divya Menon',
    title: 'AP Analyst',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0006'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-07',
    name: 'Karthik Reddy',
    title: 'Chief Technology Officer',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0007'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-08',
    name: 'Ananya Sharma',
    title: 'Engineering Manager',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0008'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-09',
    name: 'Farhan Ali',
    title: 'Senior Software Engineer',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0008', 'DEP-0009'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-10',
    name: 'Meera Pillai',
    title: 'Site Reliability Engineer',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0009'],
    isPortalUser: true,
    shiftId: 'sh-3',
  },
  {
    id: 'emp-11',
    name: "Joseph D'Souza",
    title: 'IT Support Specialist',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0010'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-12',
    name: 'Lakshmi Naidu',
    title: 'Head of Operations',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0011', 'DEP-0012'],
    isPortalUser: true,
    shiftId: null,
  },
  {
    id: 'emp-13',
    name: 'Ramesh Yadav',
    title: 'Warehouse Associate',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0012'],
    isPortalUser: false,
    shiftId: 'sh-2',
  },
  {
    id: 'emp-14',
    name: 'Sunita Devi',
    title: 'Store Associate',
    companyId: 'co-aurora-retail',
    departmentIds: ['DEP-0013'],
    isPortalUser: false,
    shiftId: null,
  },
]
