import { useMemo, useState } from 'react'
import { ArrowsClockwise, CaretLeft, CaretRight } from 'phosphor-react'
import { Button } from '@/components/ui/button'

/** Client-side pager: slices `items` and exposes display counts. */
export function usePager<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const slice = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, pageSize, safePage]
  )
  const from = items.length === 0 ? 0 : safePage * pageSize + 1
  const to = Math.min(items.length, (safePage + 1) * pageSize)
  return {
    slice,
    page: safePage,
    pageCount,
    from,
    to,
    total: items.length,
    prev: () => setPage((p) => Math.max(0, p - 1)),
    next: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
  }
}

export type Pager<T> = ReturnType<typeof usePager<T>>

/** "Showing X–Y of Z" footer with previous / next controls. */
export function PagerBar<T>({ pager, label }: { pager: Pager<T>; label: string }) {
  return (
    <div className='mt-2 flex items-center justify-between'>
      <span className='text-neutral-1000 text-xs'>
        Showing {pager.from}–{pager.to} of {pager.total} {label}
      </span>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          className='h-6 px-1.5'
          disabled={pager.page === 0}
          onClick={pager.prev}
        >
          <CaretLeft size={12} />
          Prev
        </Button>
        <span className='text-neutral-1000 px-1 text-xs'>
          Page {pager.page + 1} / {pager.pageCount}
        </span>
        <Button
          variant='outline'
          size='sm'
          className='h-6 px-1.5'
          disabled={pager.page >= pager.pageCount - 1}
          onClick={pager.next}
        >
          Next
          <CaretRight size={12} />
        </Button>
      </div>
    </div>
  )
}

/** Refresh affordance with the last-refreshed stamp next to it. */
export function RefreshButton({
  onRefresh,
  refreshedAt,
}: {
  onRefresh: () => void
  refreshedAt?: string
}) {
  return (
    <div className='flex items-center gap-2'>
      {refreshedAt && (
        <span className='text-neutral-1000 text-xs'>
          Last refreshed {refreshedAt}
        </span>
      )}
      <Button variant='outline' size='sm' className='h-7 gap-1' onClick={onRefresh}>
        <ArrowsClockwise size={12} weight='bold' />
        Refresh
      </Button>
    </div>
  )
}

/** Wizard footer: Cancel on the left, step actions on the right. */
export function StepFooter({
  onCancel,
  children,
}: {
  onCancel: () => void
  children: React.ReactNode
}) {
  return (
    <div className='mt-4 flex items-center justify-between border-t border-gray-200 pt-3'>
      <Button variant='ghost' size='sm' onClick={onCancel}>
        Cancel
      </Button>
      <div className='flex gap-2'>{children}</div>
    </div>
  )
}
