import { MagnifyingGlass } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type StatusFilter = 'all' | 'active' | 'inactive'

interface CatalogFiltersProps {
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearch: () => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  onReset: () => void
  refreshedAt: string
}

/** Name search + Active/Inactive filter + Reset for the document list (POL-21/22). */
export function CatalogFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onReset,
  refreshedAt,
}: CatalogFiltersProps) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <Input
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        placeholder='Policy document name…'
        className='h-8 w-56 bg-white'
      />
      <Button variant='outline' className='h-8' onClick={onSearch}>
        <MagnifyingGlass size={14} weight='bold' />
        Search
      </Button>
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
      >
        <SelectTrigger variant='secondary' className='h-8! w-44 bg-white'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All policies</SelectItem>
          <SelectItem value='active'>Active policies</SelectItem>
          <SelectItem value='inactive'>Inactive policies</SelectItem>
        </SelectContent>
      </Select>
      <Button variant='outline' className='h-8' onClick={onReset}>
        Reset
      </Button>
      <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
        Last refreshed {refreshedAt}
      </span>
    </div>
  )
}

interface CatalogPaginationProps {
  total: number
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  onPageChange: (page: number) => void
}

/** Paginated list with a visible total count (POL-28). */
export function CatalogPagination({
  total,
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  onPageChange,
}: CatalogPaginationProps) {
  return (
    <div className='mt-3 flex items-center justify-between'>
      <span className='text-paragraph-sm text-neutral-1000'>
        {total === 0
          ? 'No matching policy documents'
          : `Displaying items ${rangeStart}-${rangeEnd} of ${total}`}
      </span>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: pageCount }, (_, i) => (
          <Button
            key={i}
            variant={i === page ? 'default' : 'outline'}
            size='sm'
            className='w-8'
            onClick={() => onPageChange(i)}
          >
            {i + 1}
          </Button>
        ))}
        <Button
          variant='outline'
          size='sm'
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(pageCount - 1)}
        >
          Last
        </Button>
      </div>
    </div>
  )
}
