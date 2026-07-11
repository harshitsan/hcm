/**
 * Shared CSV export helper — real blob download (no toast-only stubs).
 * Blob + URL.createObjectURL + anchor pattern (the audit's reference
 * implementation from custom-fields' integration tab). Signature matches the
 * leave-local helper it replaces: exportCsv(filename, header, rows).
 */
export function exportCsv(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][]
) {
  // Commas inside values are folded to ';' — matches the custom-fields idiom.
  const esc = (v: string | number | null | undefined) =>
    String(v ?? '').replaceAll(',', ';').replaceAll('\n', ' ')
  const csv = [
    header.map(esc).join(','),
    ...rows.map((r) => r.map(esc).join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
