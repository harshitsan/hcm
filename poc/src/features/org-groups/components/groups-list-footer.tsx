import { ArrowRightSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface GroupsPagerProps {
  from: number
  to: number
  total: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

/** Item count + pager line under the table (GRP-21). */
export function GroupsPager({
  from,
  to,
  total,
  page,
  pageCount,
  onPageChange,
}: GroupsPagerProps) {
  return (
    <div className='mt-2 flex items-center justify-between'>
      <span className='text-paragraph-sm text-neutral-1000'>
        Displaying items {from} - {to} of {total}
      </span>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          className='h-7'
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className='text-paragraph-sm text-neutral-1000'>
          Page {page + 1} of {pageCount}
        </span>
        <Button
          variant='outline'
          className='h-7'
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

/** Guided org-setup strip (GRP-34/35): Save & Next + adjacent screen nav. */
export function OrgSetupStrip() {
  return (
    <div className='border-grey-200 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border bg-white px-3 py-2'>
      <span className='text-paragraph-sm text-neutral-1000'>
        Organization setup — step 3 of 5: <b>Group</b> → Work Area → Role
      </span>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          className='h-7'
          onClick={() =>
            toast.info('Opening Work Area — saved group data is retained')
          }
        >
          Work Area
        </Button>
        <Button
          variant='outline'
          className='h-7'
          onClick={() =>
            toast.info('Opening Role — saved group data is retained')
          }
        >
          Role
        </Button>
        <Button
          className='h-7'
          onClick={() =>
            toast.success('Group step saved — continuing to Work Area setup')
          }
        >
          <ArrowRightSquare className='size-3.5' />
          Save & Next
        </Button>
      </div>
    </div>
  )
}
