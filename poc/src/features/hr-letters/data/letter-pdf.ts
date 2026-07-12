/**
 * Mock "PDF" output for generated letters (F8). No real PDF library — the
 * letter is rendered into a print-styled A4 HTML page that can be downloaded
 * (named .pdf.html) or sent straight to the browser's print dialog.
 */
import { toast } from 'sonner'
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  type Signatory,
} from './hr-letters'

export interface LetterPdfInput {
  refId: string
  docType: string
  employeeName: string
  dateIso: string
  body: string
  letterhead: boolean
  signedBy: Signatory | null
  signingAuthority: string
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/** Full standalone HTML document styled as an A4 letter with letterhead. */
export function buildLetterHtml(input: LetterPdfInput): string {
  const letterheadBlock = input.letterhead
    ? `<header class="letterhead">
        <div class="brand">${escapeHtml(COMPANY_LEGAL_NAME)}</div>
        <div class="address">${escapeHtml(COMPANY_ADDRESS)}</div>
      </header>`
    : ''
  const signatureBlock = input.signedBy
    ? `<footer class="signature">
        <div class="sig-line">Signed by: ${escapeHtml(input.signedBy.name)}, ${escapeHtml(input.signedBy.title)}</div>
        <div class="sig-company">For ${escapeHtml(COMPANY_LEGAL_NAME)}</div>
      </footer>`
    : `<footer class="signature">
        <div class="sig-line muted">Awaiting signature — routed to ${escapeHtml(input.signingAuthority)}</div>
      </footer>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.docType)} — ${escapeHtml(input.employeeName)} (${escapeHtml(input.refId)})</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #e5e5e5; font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; }
  .sheet { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 22mm 20mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
  .letterhead { border-bottom: 2px solid #1a3c6e; padding-bottom: 10px; margin-bottom: 26px; }
  .brand { font-size: 20px; font-weight: 700; color: #1a3c6e; letter-spacing: .4px; }
  .address { font-size: 12px; color: #555; margin-top: 3px; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 24px; }
  .doc-type { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 18px; }
  .body { font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
  .signature { margin-top: 48px; }
  .sig-line { font-weight: 700; font-size: 14px; }
  .sig-line.muted { font-weight: 400; color: #777; font-style: italic; }
  .sig-company { font-size: 12px; color: #555; margin-top: 4px; }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; }
  }
</style>
</head>
<body>
  <div class="sheet">
    ${letterheadBlock}
    <div class="meta">
      <span>Ref: ${escapeHtml(input.refId.toUpperCase())}</span>
      <span>Date: ${dateFmt.format(new Date(input.dateIso))}</span>
    </div>
    <div class="doc-type">${escapeHtml(input.docType)}</div>
    <div class="body">${escapeHtml(input.body)}</div>
    ${signatureBlock}
  </div>
</body>
</html>`
}

/** Download the letter as a print-ready file (mock PDF, named .pdf.html). */
export function downloadLetterPdf(input: LetterPdfInput) {
  const blob = new Blob([buildLetterHtml(input)], {
    type: 'text/html;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${input.refId.toUpperCase()}-${input.docType.replace(/\s+/g, '-')}.pdf.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toast.success(`PDF downloaded — ${input.docType} for ${input.employeeName}`)
}

/** Open the letter in a new tab and trigger the browser print dialog. */
export function printLetter(input: LetterPdfInput) {
  const win = window.open('', '_blank')
  if (!win) {
    toast.error('Pop-up blocked — allow pop-ups to print this letter')
    return
  }
  win.document.write(buildLetterHtml(input))
  win.document.close()
  win.focus()
  win.print()
}
