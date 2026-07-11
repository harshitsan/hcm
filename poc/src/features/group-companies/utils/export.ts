import * as XLSX from 'xlsx'
import {
  type GroupCompany,
  type GroupMembership,
  type MemberCompany,
} from '../data/group-companies'
import { type DirectoryPerson } from '../data/sharing'

export type ExportFormat = 'xlsx' | 'csv'

/**
 * Exports the consolidated group report to Excel or CSV (US-GRV-05/07).
 * Only the rows already permitted by the rules engine (and narrowed by the
 * member-company filter) reach the file — same data as the on-screen table.
 */
export function exportConsolidatedReport(
  group: GroupCompany,
  members: GroupMembership[],
  companies: MemberCompany[],
  format: ExportFormat
): string {
  const data = members.map((m) => {
    const c = companies.find((x) => x.id === m.companyId)
    return {
      'Member company': c?.name ?? m.companyId,
      Relationship: m.relationshipType,
      'Effective from': m.effectiveFrom,
      Headcount: c?.headcount ?? 0,
      'On leave today': c?.onLeaveToday ?? 0,
      'Attendance %': c?.attendancePct ?? 0,
    }
  })
  const sheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Consolidated report')
  const fileName = `${group.code.toLowerCase()}-consolidated-report-${new Date().toISOString().slice(0, 10)}.${format}`
  XLSX.writeFile(workbook, fileName, { bookType: format })
  return fileName
}

/**
 * Exports the current cross-company directory results (US-GRV-16/18). Rows
 * withheld by row-level security never reach this function, so they never
 * reach the file either.
 */
export function exportDirectoryResults(
  rows: DirectoryPerson[],
  companyName: (id: string | null) => string,
  format: ExportFormat
): string {
  const data = rows.map((p) => ({
    Name: p.name,
    Title: p.title,
    Department: p.department,
    Company: companyName(p.companyId),
    Email: p.email,
  }))
  const sheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Directory')
  const fileName = `cross-company-directory-${new Date().toISOString().slice(0, 10)}.${format}`
  XLSX.writeFile(workbook, fileName, { bookType: format })
  return fileName
}
