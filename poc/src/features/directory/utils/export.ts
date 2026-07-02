import * as XLSX from 'xlsx'
import { type Role } from '@/context/role-context'
import { companyById, type Employee } from '../data/directory'
import {
  DIRECTORY_FIELD_KEYS,
  FIELD_LABELS,
  type CustomFieldDef,
  type DirectoryFieldKey,
} from '../data/directory-config'
import { evaluateField, type PrivacyConfig } from './privacy'

/** Every directory field except photo maps 1:1 to an Employee string prop. */
type ExportableFieldKey = Exclude<DirectoryFieldKey, 'photo'>

/**
 * Exports the current search results to Excel or CSV (DIR-08). The privacy
 * rules engine gates every column and every cell so restricted / sensitive
 * fields never reach the file (DIR-08 AC 3, DIR-21).
 */
export function exportDirectoryResults(
  rows: Employee[],
  role: Role,
  config: PrivacyConfig,
  customFields: CustomFieldDef[],
  format: 'xlsx' | 'csv',
  includeCompany: boolean
): string {
  const fields = DIRECTORY_FIELD_KEYS.filter(
    (key): key is ExportableFieldKey =>
      key !== 'photo' && evaluateField(key, role, config).visible
  )
  const exportableCustom = customFields.filter(
    (f) => f.showInDirectory && !f.sensitive
  )

  const data = rows.map((e) => {
    const record: Record<string, string> = {
      'Employee ID': e.employeeCode,
      Name: e.name,
    }
    if (includeCompany) {
      record.Company = companyById(e.companyId)?.name ?? e.companyId
    }
    for (const key of fields) {
      // Re-evaluate per record so per-company restrictions hold (DIR-15).
      const decision = evaluateField(key, role, config, e.companyId)
      record[FIELD_LABELS[key]] = decision.visible ? e[key] : ''
    }
    for (const f of exportableCustom) {
      record[f.label] = e.customFields[f.id] ?? ''
    }
    record.Status = e.employmentStatus
    return record
  })

  const sheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Directory')
  const fileName = `directory-results-${new Date().toISOString().slice(0, 10)}.${format}`
  XLSX.writeFile(workbook, fileName, { bookType: format })
  return fileName
}
