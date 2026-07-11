import {
  ArrowsClockwise,
  Copy,
  DownloadSimple,
  GitMerge,
  MagnifyingGlass,
  Plus,
  Power,
  Trash,
} from 'phosphor-react'
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

interface GroupsListToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  hasSingleSelection: boolean
  canMergeSelection: boolean
  hasSelection: boolean
  canCreate: boolean
  onRefresh: () => void
  onExport: () => void
  onClone: () => void
  onToggleStatus: () => void
  onMerge: () => void
  onDelete: () => void
  onNew: () => void
}

/** Search + status filter + action buttons above the group register. */
export function GroupsListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasSingleSelection,
  canMergeSelection,
  hasSelection,
  canCreate,
  onRefresh,
  onExport,
  onClone,
  onToggleStatus,
  onMerge,
  onDelete,
  onNew,
}: GroupsListToolbarProps) {
  return (
    <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
      <div className='flex items-center gap-2'>
        <div className='relative'>
          <MagnifyingGlass size={14} className='text-neutral-1000 absolute top-1/2 left-2 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search by name or acronym'
            className='h-7 w-[220px] pl-7'
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='active'>Active only</SelectItem>
            <SelectItem value='inactive'>Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Refresh'
          title='Refresh list'
          onClick={onRefresh}
        >
          <ArrowsClockwise size={16} />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Export group list'
          title='Export group list (CSV)'
          onClick={onExport}
        >
          <DownloadSimple size={16} />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Clone group'
          title='Clone selected group'
          disabled={!hasSingleSelection}
          onClick={onClone}
        >
          <Copy size={16} />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Toggle status'
          title='Activate / deactivate selected group'
          disabled={!hasSingleSelection}
          onClick={onToggleStatus}
        >
          <Power size={16} />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Merge group'
          title='Merge selected group into another'
          disabled={!canMergeSelection}
          onClick={onMerge}
        >
          <GitMerge size={16} />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Delete'
          title='Delete selected groups'
          disabled={!hasSelection}
          onClick={onDelete}
        >
          <Trash size={16} />
        </Button>
        {canCreate && (
          <Button
            variant='red'
            onClick={onNew}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Work Group
          </Button>
        )}
      </div>
    </div>
  )
}
