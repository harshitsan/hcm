import { useState } from 'react'
import { ArrowClockwise, CaretLeft, CaretRight } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/**
 * Shared list controls (promoted from leave/components/list-controls.tsx —
 * the scaffold-kit reference). Replaces the bespoke pagers across modules.
 */

/**
 * Explicit refresh control for mock-store lists. State is live in-memory,
 * so refresh re-confirms the latest snapshot to the user.
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

/** Previous/Next navigation with an explicit "Showing X of Y" indicator. */
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
