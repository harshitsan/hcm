/** Tiny client-side CSV download used for the group list / membership exports. */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][]
) {
  const escape = (value: string | number) => {
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
