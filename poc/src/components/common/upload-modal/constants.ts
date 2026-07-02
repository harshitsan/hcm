import type { UploadErrorDetail } from './types'

export const sampleUploadErrors: UploadErrorDetail[] = [
  {
    row: 12,
    fieldName: 'appointment_date',
    reason: 'Appointment date is in the past',
  },
  {
    row: 13,
    fieldName: 'project_deadline',
    reason: 'Project deadline is approaching',
  },
  {
    row: 14,
    fieldName: 'review_meeting_scheduled',
    reason: 'Review meeting scheduled for next week',
  },
  { row: 15, fieldName: 'phone', reason: 'Missing mandatory field: phone' },
  {
    row: 14,
    fieldName: 'model_code',
    reason: 'Invalid model code (must be one of: Alto, Swift, Baleno)',
  },
  { row: 15, fieldName: 'inventory_code', reason: 'Invalid inventory code' },
  { row: 16, fieldName: 'name', reason: 'Missing mandatory field: name' },
  {
    row: 20,
    fieldName: 'contact_no',
    reason: 'Missing Mandatory fields: name and contact no.',
  },
  {
    row: 25,
    fieldName: 'reference_number',
    reason: 'Duplicate reference number',
  },
  { row: 30, fieldName: 'date', reason: 'Invalid date format' },
]
