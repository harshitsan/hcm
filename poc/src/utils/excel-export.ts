import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
}

export function exportToExcel<T extends object>(
  data: T[],
  columns: { key: string; header: string }[],
  options: ExcelExportOptions = {}
): void {
  const { filename = 'download.xlsx', sheetName = 'Readywire' } = options

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()

  // Prepare data for Excel
  const excelData = data.map((row) => {
    const excelRow: Record<string, unknown> = {}
    columns.forEach((column) => {
      excelRow[column.header] = (row as Record<string, unknown>)[column.key]
    })
    return excelRow
  })

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename)
}
