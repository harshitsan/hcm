import { useState } from 'react'
import { ArrowClockwise, CaretLeft, CaretRight } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/**
 * Explicit refresh control for mock-store lists (ETMPL-03, NTMPL-03, FMQR-03,
 * FMRR-03, TOM-04, UPTO-05, HOLCAL-05, HOL-04, TOS-03, OC-04). State is live
 * in-memory, so refresh re-confirms the latest snapshot to the user.
 */
export function RefreshButton({ label }: { label: string }) {
  return (
    <Button
      variant='outline'
      className='h-7 gap-1'
      onClick={() =>
        toast.success(`${label} refreshed — showing the latest data`)
      }
    >
      <ArrowClockwise size={12} weight='bold' />
      Refresh
    </Button>
  )
}

/** Client-side pager over an already-filtered list. */
export function usePager<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  return {
    page: safePage,
    pageCount,
    total: items.length,
    pageItems: items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    prev: () => setPage((p) => Math.max(0, Math.min(p, pageCount - 1) - 1)),
    next: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
  }
}

interface PagerControlsProps {
  page: number
  pageCount: number
  total: number
  onPrev: () => void
  onNext: () => void
}

/**
 * Back / Next navigation with a page indicator (ETMPL-04, FMAPP-04, TOAA-04,
 * TOAP-05, HOLCAL-05, PTO-06).
 */
export function PagerControls({
  page,
  pageCount,
  total,
  onPrev,
  onNext,
}: PagerControlsProps) {
  return (
    <div className='mt-2 flex items-center justify-between'>
      <span className='text-neutral-1000 text-xs'>
        Page {page + 1} of {pageCount} · {total} record{total === 1 ? '' : 's'}
      </span>
      <span className='flex gap-1'>
        <Button
          variant='outline'
          className='h-6 gap-1 px-2 text-xs'
          disabled={page === 0}
          onClick={onPrev}
        >
          <CaretLeft size={10} weight='bold' />
          Back
        </Button>
        <Button
          variant='outline'
          className='h-6 gap-1 px-2 text-xs'
          disabled={page >= pageCount - 1}
          onClick={onNext}
        >
          Next
          <CaretRight size={10} weight='bold' />
        </Button>
      </span>
    </div>
  )
}
