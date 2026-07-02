import { CURRENT_EMPLOYEE, type ModuleName } from './org'

/** Entities that support attachments per FR 6.22.1. */
export const ENTITY_TYPES = ['Company', 'Employee', 'Candidate'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

/** Module each entity's uploads belong to — drives document-type scoping. */
export const ENTITY_MODULE: Record<EntityType, ModuleName> = {
  Company: 'Organization',
  Employee: 'Employee Management',
  Candidate: 'Talent Acquisition',
}

/** Full platform-supported format list per FR 6.22.2. */
export const ALL_FORMATS = [
  'PDF',
  'JPG',
  'JPEG',
  'DOC',
  'DOCX',
  'XLS',
  'XLSX',
  'PNG',
  'TXT',
] as const
export type DocumentFormat = (typeof ALL_FORMATS)[number]

export const DEFAULT_CATEGORIES = [
  'Identity Proof',
  'Contract',
  'Certification',
  'Financial',
  'General',
] as const

export interface DocumentRecord {
  id: string
  name: string
  fileName: string
  format: DocumentFormat
  sizeKb: number
  entityType: EntityType
  entityName: string
  company: string
  category: string
  documentType: string
  uploadDate: string
  uploadedBy: string
  /** ISO expiry date, or null for non-expiring documents. */
  expiryDate: string | null
}

export type ExpiryStatus = 'expired' | 'expiring' | 'active' | 'none'

/** Expiration-tracking rule: null never expires; lead time sets the warning window. */
export function expiryStatusOf(
  expiryDate: string | null,
  leadDays: number,
  todayIsoDate: string = new Date().toISOString().slice(0, 10)
): ExpiryStatus {
  if (!expiryDate) return 'none'
  if (expiryDate < todayIsoDate) return 'expired'
  const windowEnd = new Date(`${todayIsoDate}T00:00:00`)
  windowEnd.setDate(windowEnd.getDate() + leadDays)
  if (expiryDate <= windowEnd.toISOString().slice(0, 10)) return 'expiring'
  return 'active'
}

export const seedDocuments: DocumentRecord[] = [
  {
    id: 'doc-1001',
    name: 'GST Registration Certificate',
    fileName: 'gst-registration.pdf',
    format: 'PDF',
    sizeKb: 842,
    entityType: 'Company',
    entityName: 'Meridian Retail',
    company: 'Meridian Retail',
    category: 'Certification',
    documentType: 'Company Registration',
    uploadDate: '2026-04-02',
    uploadedBy: 'Dana Whitfield',
    expiryDate: '2027-03-31',
  },
  {
    id: 'doc-1002',
    name: 'Trade License 2026',
    fileName: 'trade-license-2026.pdf',
    format: 'PDF',
    sizeKb: 1210,
    entityType: 'Company',
    entityName: 'Meridian Retail',
    company: 'Meridian Retail',
    category: 'Certification',
    documentType: 'Compliance Audit Report',
    uploadDate: '2026-01-15',
    uploadedBy: 'Dana Whitfield',
    expiryDate: '2026-07-18',
  },
  {
    id: 'doc-1003',
    name: 'Office Lease Agreement',
    fileName: 'lease-agreement-hq.docx',
    format: 'DOCX',
    sizeKb: 655,
    entityType: 'Company',
    entityName: 'Meridian Retail',
    company: 'Meridian Retail',
    category: 'Contract',
    documentType: 'Vendor Agreement',
    uploadDate: '2025-11-20',
    uploadedBy: 'Dana Whitfield',
    expiryDate: '2026-06-15',
  },
  {
    id: 'doc-1004',
    name: 'Aadhaar Card — Ravi Menon',
    fileName: 'aadhaar-ravi-menon.jpg',
    format: 'JPG',
    sizeKb: 480,
    entityType: 'Employee',
    entityName: CURRENT_EMPLOYEE.name,
    company: 'Meridian Retail',
    category: 'Identity Proof',
    documentType: 'ID Proof',
    uploadDate: '2026-02-11',
    uploadedBy: 'Dana Whitfield',
    expiryDate: null,
  },
  {
    id: 'doc-1005',
    name: 'Employment Contract — Ravi Menon',
    fileName: 'contract-ravi-menon.pdf',
    format: 'PDF',
    sizeKb: 910,
    entityType: 'Employee',
    entityName: CURRENT_EMPLOYEE.name,
    company: 'Meridian Retail',
    category: 'Contract',
    documentType: 'Employment Contract',
    uploadDate: '2026-02-11',
    uploadedBy: 'Dana Whitfield',
    expiryDate: '2027-02-10',
  },
  {
    id: 'doc-1006',
    name: 'Salary Revision — Ravi Menon',
    fileName: 'salary-revision-2026.pdf',
    format: 'PDF',
    sizeKb: 320,
    entityType: 'Employee',
    entityName: CURRENT_EMPLOYEE.name,
    company: 'Meridian Retail',
    category: 'Financial',
    documentType: 'Salary Revision Letter',
    uploadDate: '2026-04-01',
    uploadedBy: 'Dana Whitfield',
    expiryDate: null,
  },
  {
    id: 'doc-1007',
    name: 'Work Visa — Elena Cruz',
    fileName: 'work-visa-elena.png',
    format: 'PNG',
    sizeKb: 1480,
    entityType: 'Employee',
    entityName: 'Elena Cruz',
    company: 'Meridian Retail',
    category: 'Identity Proof',
    documentType: 'ID Proof',
    uploadDate: '2025-08-04',
    uploadedBy: 'Dana Whitfield',
    expiryDate: '2026-07-25',
  },
  {
    id: 'doc-1008',
    name: 'First Aid Certification — Tom Iyer',
    fileName: 'first-aid-tom.pdf',
    format: 'PDF',
    sizeKb: 233,
    entityType: 'Employee',
    entityName: 'Tom Iyer',
    company: 'Meridian Retail',
    category: 'Certification',
    documentType: 'Educational Certificate',
    uploadDate: '2025-05-19',
    uploadedBy: 'Priya Nair',
    expiryDate: '2026-05-30',
  },
  {
    id: 'doc-1009',
    name: 'Resume — Anita Bose',
    fileName: 'resume-anita-bose.docx',
    format: 'DOCX',
    sizeKb: 145,
    entityType: 'Candidate',
    entityName: 'Anita Bose',
    company: 'Meridian Retail',
    category: 'General',
    documentType: 'Resume',
    uploadDate: '2026-06-20',
    uploadedBy: 'Priya Nair',
    expiryDate: null,
  },
  {
    id: 'doc-1010',
    name: 'Degree Certificate — Anita Bose',
    fileName: 'degree-anita-bose.pdf',
    format: 'PDF',
    sizeKb: 760,
    entityType: 'Candidate',
    entityName: 'Anita Bose',
    company: 'Meridian Retail',
    category: 'Certification',
    documentType: 'Educational Certificate',
    uploadDate: '2026-06-21',
    uploadedBy: 'Priya Nair',
    expiryDate: null,
  },
  {
    id: 'doc-1011',
    name: 'Offer Letter — Karan Shah',
    fileName: 'offer-karan-shah.pdf',
    format: 'PDF',
    sizeKb: 402,
    entityType: 'Candidate',
    entityName: 'Karan Shah',
    company: 'Meridian Retail',
    category: 'General',
    documentType: 'Offer Letter',
    uploadDate: '2026-06-28',
    uploadedBy: 'Priya Nair',
    expiryDate: '2026-07-12',
  },
  {
    id: 'doc-1012',
    name: 'Fleet Insurance Policy',
    fileName: 'fleet-insurance.pdf',
    format: 'PDF',
    sizeKb: 1890,
    entityType: 'Company',
    entityName: 'Meridian Logistics',
    company: 'Meridian Logistics',
    category: 'Financial',
    documentType: 'Insurance Policy',
    uploadDate: '2026-03-10',
    uploadedBy: 'Marcus Lane',
    expiryDate: '2026-07-09',
  },
  {
    id: 'doc-1013',
    name: 'Driver Contract — Suresh Pillai',
    fileName: 'driver-contract-suresh.pdf',
    format: 'PDF',
    sizeKb: 512,
    entityType: 'Employee',
    entityName: 'Suresh Pillai',
    company: 'Meridian Logistics',
    category: 'Contract',
    documentType: 'Employment Contract',
    uploadDate: '2026-01-05',
    uploadedBy: 'Marcus Lane',
    expiryDate: '2026-12-31',
  },
  {
    id: 'doc-1014',
    name: 'FSSAI License',
    fileName: 'fssai-license.pdf',
    format: 'PDF',
    sizeKb: 998,
    entityType: 'Company',
    entityName: 'Northwind Foods',
    company: 'Northwind Foods',
    category: 'Certification',
    documentType: 'Company Registration',
    uploadDate: '2025-10-01',
    uploadedBy: 'Owen Clarke',
    expiryDate: '2026-06-20',
  },
  {
    id: 'doc-1015',
    name: 'Payroll Tax Filing Q1',
    fileName: 'payroll-tax-q1.xlsx',
    format: 'XLSX',
    sizeKb: 88,
    entityType: 'Company',
    entityName: 'Northwind Dairy',
    company: 'Northwind Dairy',
    category: 'Financial',
    documentType: 'Tax Certificate',
    uploadDate: '2026-04-14',
    uploadedBy: 'Owen Clarke',
    expiryDate: null,
  },
  {
    id: 'doc-1016',
    name: 'Cold-chain Audit Notes',
    fileName: 'cold-chain-audit.txt',
    format: 'TXT',
    sizeKb: 12,
    entityType: 'Company',
    entityName: 'Northwind Dairy',
    company: 'Northwind Dairy',
    category: 'General',
    documentType: 'Compliance Audit Report',
    uploadDate: '2026-06-02',
    uploadedBy: 'Owen Clarke',
    expiryDate: '2026-08-30',
  },
]
