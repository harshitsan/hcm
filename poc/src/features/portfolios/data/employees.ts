/**
 * Cross-company employee directory used by the Portfolio Operations tab
 * (PORT-21 bulk import, PORT-22 cross-company search). Results are always
 * filtered by row-level security to the viewer's authorized companies.
 */
export interface PortfolioEmployee {
  id: string
  name: string
  email: string
  companyId: string
  department: string
  designation: string
}

export const PORTFOLIO_EMPLOYEES: PortfolioEmployee[] = [
  {
    id: 'emp-01',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@meridiantech.in',
    companyId: 'co-01',
    department: 'Engineering',
    designation: 'Staff Engineer',
  },
  {
    id: 'emp-02',
    name: 'Rohit Deshpande',
    email: 'rohit.d@meridiantech.in',
    companyId: 'co-01',
    department: 'Product',
    designation: 'Product Manager',
  },
  {
    id: 'emp-03',
    name: 'Meera Kulkarni',
    email: 'meera.k@meridiantech.in',
    companyId: 'co-01',
    department: 'Human Resources',
    designation: 'HR Business Partner',
  },
  {
    id: 'emp-04',
    name: 'Vikram Shetty',
    email: 'vikram.s@northlinelog.in',
    companyId: 'co-02',
    department: 'Operations',
    designation: 'Fleet Supervisor',
  },
  {
    id: 'emp-05',
    name: 'Farah Khan',
    email: 'farah.khan@northlinelog.in',
    companyId: 'co-02',
    department: 'Finance',
    designation: 'Senior Accountant',
  },
  {
    id: 'emp-06',
    name: 'Ethan Caldwell',
    email: 'ethan.c@cascadeanalytics.com',
    companyId: 'co-03',
    department: 'Data Science',
    designation: 'Principal Data Scientist',
  },
  {
    id: 'emp-07',
    name: 'Maya Robinson',
    email: 'maya.r@cascadeanalytics.com',
    companyId: 'co-03',
    department: 'Sales',
    designation: 'Account Executive',
  },
  {
    id: 'emp-08',
    name: 'Suresh Nair',
    email: 'suresh.nair@bluegrainfoods.in',
    companyId: 'co-04',
    department: 'Supply Chain',
    designation: 'Procurement Lead',
  },
  {
    id: 'emp-09',
    name: 'Divya Menon',
    email: 'divya.menon@bluegrainfoods.in',
    companyId: 'co-04',
    department: 'Quality',
    designation: 'QA Manager',
  },
  {
    id: 'emp-10',
    name: 'Lukas Brandt',
    email: 'lukas.brandt@helixbio.eu',
    companyId: 'co-05',
    department: 'Research',
    designation: 'Research Scientist',
  },
  {
    id: 'emp-11',
    name: 'Pooja Agarwal',
    email: 'pooja.a@zephyrretail.in',
    companyId: 'co-06',
    department: 'Retail Ops',
    designation: 'Regional Manager',
  },
  {
    id: 'emp-12',
    name: 'Arjun Malhotra',
    email: 'arjun.m@zephyrretail.in',
    companyId: 'co-06',
    department: 'Marketing',
    designation: 'Brand Manager',
  },
  {
    id: 'emp-13',
    name: 'Wei Ling Tan',
    email: 'weiling.tan@quantafinance.sg',
    companyId: 'co-07',
    department: 'Risk',
    designation: 'Risk Analyst',
  },
  {
    id: 'emp-14',
    name: 'Hassan Al-Farsi',
    email: 'hassan.f@sundalehosp.ae',
    companyId: 'co-08',
    department: 'Guest Services',
    designation: 'Operations Director',
  },
  {
    id: 'emp-15',
    name: 'Nikhil Verma',
    email: 'nikhil.v@verdantenergy.in',
    companyId: 'co-10',
    department: 'Engineering',
    designation: 'Site Engineer',
  },
  {
    id: 'emp-16',
    name: 'Sara Whitman',
    email: 'sara.w@atlasfreight.com',
    companyId: 'co-11',
    department: 'Logistics',
    designation: 'Dispatch Manager',
  },
]
