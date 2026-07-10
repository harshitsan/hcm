/**
 * Kensium: Employee Management > Document Custodian — Receipts & Returns.
 * A receipt records a document handed over to the custodian (optionally the
 * physical original), its expiry-notification rules, and the return /
 * acknowledgement trail back to the employee.
 */

/** Fixed "today" for the custodian desk so reminder seeds stay deterministic. */
export const CUSTODIAN_TODAY = '2026-07-09'

export const NOTIFY_ROLE_OPTIONS = [
  'HR',
  'Reporting Manager',
  'Employee',
  'Other',
] as const
export type NotifyRole = (typeof NOTIFY_ROLE_OPTIONS)[number]

export type ReceiptStatus =
  | 'with-custodian'
  | 'returned-temporary'
  | 'returned-permanent'
  | 'acknowledged'

export type ReturnType = 'Temporary' | 'Permanent'

export interface ReceiptReturnDetails {
  returnType: ReturnType
  returnedOn: string
  /** Temporary returns only — when the employee must hand the document back. */
  expectedDateOfSubmission?: string
  collectReminderRequired?: boolean
  collectReminderDaysBefore?: number
  comments?: string
}

export interface ReceiptAcknowledgement {
  acknowledgedOn: string
  comments: string
}

export interface DocumentReceipt {
  id: string
  employeeName: string
  employeeCode: string
  documentType: string
  documentName: string
  dateOfIssuance: string
  expiryDate?: string
  country: string
  state: string
  issueAuthority: string
  notificationRequired: boolean
  notifyBeforeDays?: number
  /** Roles alerted before expiry (HR / Reporting Manager / Employee / Other). */
  peopleToNotify?: string[]
  extraEmailIds?: string
  uploadedFileName?: string
  /** Physical originals in custody can never be deleted from the register. */
  hasPhysicalCopy: boolean
  custodianComments?: string
  expectedDateOfReturn?: string
  returnReminderRequired?: boolean
  returnReminderDaysBefore?: number
  status: ReceiptStatus
  returnDetails?: ReceiptReturnDetails
  acknowledgement?: ReceiptAcknowledgement
}

/** Reminder computed for the custodian desk: chase a return or a collection. */
export interface ReceiptReminder {
  receipt: DocumentReceipt
  kind: 'return-to-employee' | 'collect-from-employee'
  dueOn: string
  overdue: boolean
}

const DEFAULT_REMINDER_LEAD_DAYS = 7

function withinWindow(dueOn: string, leadDays: number, today: string): boolean {
  const windowEnd = new Date(`${today}T00:00:00`)
  windowEnd.setDate(windowEnd.getDate() + leadDays)
  return dueOn <= windowEnd.toISOString().slice(0, 10)
}

/**
 * Receipts the custodian must chase: documents due back to employees
 * (expectedDateOfReturn) and temporary returns due back from employees
 * (returnDetails.expectedDateOfSubmission), each within its reminder lead
 * time — or already overdue.
 */
export function receiptReminders(
  receipts: DocumentReceipt[],
  today: string = CUSTODIAN_TODAY
): ReceiptReminder[] {
  const reminders: ReceiptReminder[] = []
  receipts.forEach((receipt) => {
    if (receipt.status === 'with-custodian' && receipt.expectedDateOfReturn) {
      const lead = receipt.returnReminderRequired
        ? (receipt.returnReminderDaysBefore ?? DEFAULT_REMINDER_LEAD_DAYS)
        : DEFAULT_REMINDER_LEAD_DAYS
      if (withinWindow(receipt.expectedDateOfReturn, lead, today)) {
        reminders.push({
          receipt,
          kind: 'return-to-employee',
          dueOn: receipt.expectedDateOfReturn,
          overdue: receipt.expectedDateOfReturn < today,
        })
      }
    }
    const submission = receipt.returnDetails?.expectedDateOfSubmission
    if (receipt.status === 'returned-temporary' && submission) {
      const lead = receipt.returnDetails?.collectReminderRequired
        ? (receipt.returnDetails.collectReminderDaysBefore ??
          DEFAULT_REMINDER_LEAD_DAYS)
        : DEFAULT_REMINDER_LEAD_DAYS
      if (withinWindow(submission, lead, today)) {
        reminders.push({
          receipt,
          kind: 'collect-from-employee',
          dueOn: submission,
          overdue: submission < today,
        })
      }
    }
  })
  return reminders.sort((a, b) => a.dueOn.localeCompare(b.dueOn))
}

export const seedReceipts: DocumentReceipt[] = [
  {
    id: 'rcpt-01',
    employeeName: 'Ravi Menon',
    employeeCode: 'MRT-0042',
    documentType: 'ID Proof',
    documentName: 'Passport — R8814327 (Original)',
    dateOfIssuance: '2021-03-18',
    expiryDate: '2031-03-17',
    country: 'India',
    state: 'Tamil Nadu',
    issueAuthority: 'Regional Passport Office, Chennai',
    notificationRequired: true,
    notifyBeforeDays: 60,
    peopleToNotify: ['HR', 'Employee'],
    uploadedFileName: 'passport-ravi-menon.pdf',
    hasPhysicalCopy: true,
    custodianComments: 'Original held for work-permit stamping.',
    expectedDateOfReturn: '2026-07-12',
    returnReminderRequired: true,
    returnReminderDaysBefore: 5,
    status: 'with-custodian',
  },
  {
    id: 'rcpt-02',
    employeeName: 'Ravi Menon',
    employeeCode: 'MRT-0042',
    documentType: 'Educational Certificate',
    documentName: 'B.Com Degree Certificate (Original)',
    dateOfIssuance: '2014-06-30',
    country: 'India',
    state: 'Tamil Nadu',
    issueAuthority: 'University of Madras',
    notificationRequired: false,
    hasPhysicalCopy: true,
    custodianComments: 'Original collected during onboarding verification.',
    expectedDateOfReturn: '2026-06-28',
    status: 'returned-temporary',
    returnDetails: {
      returnType: 'Temporary',
      returnedOn: '2026-06-28',
      expectedDateOfSubmission: '2026-07-14',
      collectReminderRequired: true,
      collectReminderDaysBefore: 7,
      comments: 'Handed over for bank education-loan verification.',
    },
  },
  {
    id: 'rcpt-03',
    employeeName: 'Ravi Menon',
    employeeCode: 'MRT-0042',
    documentType: 'Experience Letter',
    documentName: 'Experience Letter — Zenith Corp (Original)',
    dateOfIssuance: '2020-01-10',
    country: 'India',
    state: 'Karnataka',
    issueAuthority: 'Zenith Corp HR Department',
    notificationRequired: false,
    uploadedFileName: 'experience-zenith-ravi.pdf',
    hasPhysicalCopy: true,
    status: 'returned-permanent',
    returnDetails: {
      returnType: 'Permanent',
      returnedOn: '2026-07-02',
      comments:
        'Background verification complete — original no longer required.',
    },
  },
  {
    id: 'rcpt-04',
    employeeName: 'Elena Cruz',
    employeeCode: 'MRT-0077',
    documentType: 'ID Proof',
    documentName: 'Work Visa (Original)',
    dateOfIssuance: '2024-07-26',
    expiryDate: '2026-07-25',
    country: 'India',
    state: 'Tamil Nadu',
    issueAuthority: 'Bureau of Immigration, Chennai FRRO',
    notificationRequired: true,
    notifyBeforeDays: 30,
    peopleToNotify: ['HR', 'Reporting Manager', 'Employee'],
    extraEmailIds: 'immigration-desk@meridianretail.example',
    uploadedFileName: 'work-visa-elena.png',
    hasPhysicalCopy: true,
    custodianComments: 'Held pending visa-renewal filing.',
    expectedDateOfReturn: '2026-08-01',
    status: 'with-custodian',
  },
  {
    id: 'rcpt-05',
    employeeName: 'Elena Cruz',
    employeeCode: 'MRT-0077',
    documentType: 'ID Proof',
    documentName: 'PAN Card (Original)',
    dateOfIssuance: '2019-11-05',
    country: 'India',
    state: 'Maharashtra',
    issueAuthority: 'Income Tax Department',
    notificationRequired: false,
    hasPhysicalCopy: true,
    status: 'returned-temporary',
    returnDetails: {
      returnType: 'Temporary',
      returnedOn: '2026-06-25',
      expectedDateOfSubmission: '2026-07-06',
      collectReminderRequired: true,
      collectReminderDaysBefore: 3,
      comments: 'Needed for opening the salary account.',
    },
  },
  {
    id: 'rcpt-06',
    employeeName: 'Tom Iyer',
    employeeCode: 'MRT-0113',
    documentType: 'Educational Certificate',
    documentName: 'First Aid Certification (Original)',
    dateOfIssuance: '2024-05-19',
    expiryDate: '2026-05-30',
    country: 'India',
    state: 'Tamil Nadu',
    issueAuthority: 'St. John Ambulance Association',
    notificationRequired: true,
    notifyBeforeDays: 15,
    peopleToNotify: ['Employee'],
    uploadedFileName: 'first-aid-tom.pdf',
    hasPhysicalCopy: true,
    status: 'acknowledged',
    returnDetails: {
      returnType: 'Permanent',
      returnedOn: '2026-06-20',
      comments: 'Certification expired — returned for renewal.',
    },
    acknowledgement: {
      acknowledgedOn: '2026-06-21',
      comments: 'Received the original in good condition.',
    },
  },
  {
    id: 'rcpt-07',
    employeeName: 'Suresh Pillai',
    employeeCode: 'MLG-0208',
    documentType: 'Employment Contract',
    documentName: 'Signed Driver Contract (Scanned Copy)',
    dateOfIssuance: '2026-01-05',
    expiryDate: '2026-12-31',
    country: 'India',
    state: 'Tamil Nadu',
    issueAuthority: 'Meridian Logistics HR',
    notificationRequired: true,
    notifyBeforeDays: 45,
    peopleToNotify: ['HR', 'Reporting Manager'],
    uploadedFileName: 'driver-contract-suresh.pdf',
    hasPhysicalCopy: false,
    custodianComments: 'Digital copy only — original with the employee.',
    expectedDateOfReturn: '2026-08-15',
    status: 'with-custodian',
  },
]
