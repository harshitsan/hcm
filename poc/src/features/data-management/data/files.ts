/**
 * Real client-side file generation for the mock engine: entity import
 * templates, export outputs and CSV assembly shared with the error report.
 * XLSX outputs carry CSV content under an .xlsx name — acceptable for the
 * POC; JSON outputs are real JSON.
 */
import {
  IMPORT_FUNCTIONS,
  type FileFormat,
  type ImportFunction,
} from './catalog'

export function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [
    header.map(csvCell).join(','),
    ...rows.map((r) => r.map(csvCell).join(',')),
  ].join('\n')
}

export function downloadFile(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Example cell values used in templates and export mocks, by field name. */
const EXAMPLE_VALUES: Record<string, string> = {
  'Company Code': 'e.g. AUR-01',
  'Company Name': 'e.g. Aurora Software Ltd',
  Country: 'e.g. India',
  Currency: 'e.g. INR',
  'Time Zone': 'e.g. Asia/Kolkata',
  Address: 'e.g. Plot 12, Hitec City',
  'Location Code': 'e.g. LOC-HYD-01',
  'Location Name': 'e.g. Hyderabad HQ',
  'Parent Company': 'e.g. Aurora Software Ltd',
  City: 'e.g. Hyderabad',
  State: 'e.g. Telangana',
  'Department Code': 'e.g. DEP-ENG-01',
  'Department Name': 'e.g. Engineering',
  'Cost Center': 'e.g. CC-1040',
  'Department Head': 'e.g. Priya Nair',
  'Floor Zone': 'e.g. Tower B / Level 4',
  'Group Code': 'e.g. GRP-OPS',
  'Group Name': 'e.g. Operations',
  Description: 'e.g. Cross-company operations group',
  'Employee Id': 'e.g. EMP-1001',
  'First Name': 'e.g. Asha',
  'Last Name': 'e.g. Rao',
  Department: 'e.g. Engineering',
  'Joining Date': 'e.g. 2026-04-01',
  Email: 'e.g. asha.rao@example.com',
  Designation: 'e.g. Senior Engineer',
  Location: 'e.g. Hyderabad HQ',
  'Effective From': 'e.g. 2026-04-01',
  'T-Shirt Size': 'e.g. M',
  'Transit Route': 'e.g. Route 7',
  'Document Type': 'e.g. Degree Certificate',
  'File Name': 'e.g. degree_emp1001.pdf',
  'Issue Date': 'e.g. 2019-06-30',
  'Expiry Date': 'e.g. 2030-06-30',
  'Leave Type': 'e.g. Casual',
  Balance: 'e.g. 12',
  'Accrual Rate': 'e.g. 1 per month',
  'Carry Forward': 'e.g. Yes',
  Date: 'e.g. 2026-05-12',
  'Check In': 'e.g. 09:05',
  'Check Out': 'e.g. 18:12',
  Shift: 'e.g. General',
  'Source Device': 'e.g. Biometric — Gate 2',
  'Timesheet Template': 'e.g. Standard 40h',
  'Project Name': 'e.g. Atlas Migration',
  'Structure Code': 'e.g. STR-A',
  Basic: 'e.g. 45000',
  HRA: 'e.g. 18000',
  Allowances: 'e.g. 6000',
  'Registration Id': 'e.g. U72200TG2016PTC000000',
}

function exampleFor(field: string): string {
  return EXAMPLE_VALUES[field] ?? `e.g. ${field}`
}

/**
 * Downloads the import template for a function: all target fields as the
 * header plus one example row (required fields first).
 */
export function downloadImportTemplate(fn: ImportFunction, entityName: string) {
  const fields = [...fn.requiredFields, ...fn.fields, ...fn.customFields]
  const csv = toCsv(fields, [fields.map(exampleFor)])
  downloadFile(
    `${entityName.toLowerCase().replace(/\s+/g, '-')}-import-template.csv`,
    csv,
    'text/csv'
  )
}

export function exportFileName(entity: string, format: FileFormat): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${entity.toLowerCase()}_export_${date}.${format.toLowerCase()}`
}

/** Deterministic mock rows for an entity export. */
function exportRows(
  entity: string,
  companyName: string,
  count: number
): Record<string, string>[] {
  const fn =
    IMPORT_FUNCTIONS.find(
      (f) => f.entityId === entity.toLowerCase().replace(/\s+/g, '-')
    ) ??
    IMPORT_FUNCTIONS.find((f) =>
      f.name.toLowerCase().startsWith(entity.toLowerCase())
    )
  const fields = fn
    ? [...fn.requiredFields, ...fn.fields]
    : ['Code', 'Name', 'Parent Company']
  const rows: Record<string, string>[] = []
  for (let i = 0; i < count; i++) {
    const row: Record<string, string> = {}
    for (const field of fields) {
      const sample = exampleFor(field).replace(/^e\.g\. /, '')
      row[field] = /\d+$/.test(sample)
        ? sample.replace(/\d+$/, (d) => String(Number(d) + i))
        : field === 'Parent Company'
          ? companyName
          : `${sample}${field.endsWith('Name') || field.endsWith('Id') || field.endsWith('Code') ? ` ${i + 1}` : ''}`
    }
    rows.push(row)
  }
  return rows
}

/**
 * Builds and downloads a real export file. CSV and XLSX carry CSV content
 * (XLSX keeps the .xlsx name for the mock); JSON is real JSON.
 */
export function downloadExportFile(input: {
  entity: string
  companyName: string
  format: FileFormat
  fileName: string
  totalRecords: number
}) {
  // Cap the generated file at a representative sample for the mock.
  const rows = exportRows(
    input.entity,
    input.companyName,
    Math.min(input.totalRecords, 250)
  )
  if (input.format === 'JSON') {
    downloadFile(
      input.fileName,
      JSON.stringify(
        { entity: input.entity, company: input.companyName, records: rows },
        null,
        2
      ),
      'application/json'
    )
    return
  }
  const header = rows.length > 0 ? Object.keys(rows[0]) : ['Code', 'Name']
  const csv = toCsv(
    header,
    rows.map((r) => header.map((h) => r[h] ?? ''))
  )
  downloadFile(
    input.fileName,
    csv,
    input.format === 'CSV' ? 'text/csv' : 'application/vnd.ms-excel'
  )
}
