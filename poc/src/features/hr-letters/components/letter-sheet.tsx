import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  type Signatory,
} from '../data/hr-letters'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

interface LetterSheetProps {
  refId: string
  docType: string
  dateIso: string
  /** Fully rendered body — merge fields already resolved. */
  body: string
  letterhead: boolean
  signedBy: Signatory | null
  signingAuthority: string
}

/**
 * Print-styled A4-ish letter preview with company letterhead and the
 * signature block ("Signed by: NAME, TITLE") recorded at approval.
 */
export function LetterSheet({
  refId,
  docType,
  dateIso,
  body,
  letterhead,
  signedBy,
  signingAuthority,
}: LetterSheetProps) {
  return (
    <div className='mx-auto w-full max-w-[480px] rounded-[4px] border border-gray-300 bg-white p-6 font-serif shadow-md'>
      {letterhead && (
        <div className='mb-5 border-b-2 border-[#1a3c6e] pb-2'>
          <p className='text-[15px] font-bold tracking-wide text-[#1a3c6e]'>
            {COMPANY_LEGAL_NAME}
          </p>
          <p className='text-[11px] text-neutral-500'>{COMPANY_ADDRESS}</p>
        </div>
      )}
      <div className='mb-4 flex items-center justify-between text-[11px] text-neutral-500'>
        <span>Ref: {refId.toUpperCase()}</span>
        <span>Date: {dateFmt.format(new Date(dateIso))}</span>
      </div>
      <p className='mb-3 text-[12px] font-bold tracking-widest text-neutral-800 uppercase'>
        {docType}
      </p>
      <pre className='text-neutral-1900 font-serif text-[13px] leading-relaxed whitespace-pre-wrap'>
        {body}
      </pre>
      <div className='mt-8'>
        {signedBy ? (
          <>
            <p className='text-[13px] font-bold text-neutral-900'>
              Signed by: {signedBy.name}, {signedBy.title}
            </p>
            <p className='text-[11px] text-neutral-500'>
              For {COMPANY_LEGAL_NAME}
            </p>
          </>
        ) : (
          <p className='text-[12px] text-neutral-500 italic'>
            Awaiting signature — routed to {signingAuthority}
          </p>
        )}
      </div>
    </div>
  )
}
