import { useState } from 'react'
import { Funnel, Gear, Plus, SquaresFour, Table as TableIcon } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { facetOptionsFor } from './build-columns'
import {
  countActiveFilters,
  emptyFilterFor,
  isFilterActive,
  type FacetFilter,
  type FilterValue,
  type RangeFilter,
} from './filters'
import type { ColumnSpec, TableSpec } from './spec'

export type ViewMode = 'table' | 'card' | 'list'

interface TableToolbarProps<T> {
  spec: TableSpec<T>
  data: T[]
  filters: Record<string, FilterValue>
  onFiltersChange: (next: Record<string, FilterValue>) => void
  visibility: Record<string, boolean>
  onVisibilityChange: (next: Record<string, boolean>) => void
  view?: ViewMode
  onViewChange?: (v: ViewMode) => void
}

function FacetControl<T>({
  spec, data, col, value, onChange,
}: {
  spec: TableSpec<T>
  data: T[]
  col: ColumnSpec<T>
  value: FacetFilter
  onChange: (v: FilterValue) => void
}) {
  const options = facetOptionsFor(spec, data, col.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm'>
          {col.header}
          {value.selected.length > 0 && (
            <Badge variant='open'>{value.selected.length}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt}
            checked={value.selected.includes(opt)}
            onCheckedChange={(on) =>
              onChange({
                kind: 'facet',
                selected: on
                  ? [...value.selected, opt]
                  : value.selected.filter((s) => s !== opt),
              })
            }
          >
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RangeControl({
  label, value, onChange,
}: {
  label: string
  value: RangeFilter
  onChange: (v: FilterValue) => void
}) {
  return (
    <div className='space-y-1'>
      <label className='text-paragraph-sm text-neutral-1000'>{label}</label>
      <div className='flex items-center gap-2'>
        <Input
          type='number'
          placeholder='Min'
          value={value.min ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              min: e.target.value === '' ? null : Number(e.target.value),
            })
          }
        />
        <span className='text-neutral-1000'>–</span>
        <Input
          type='number'
          placeholder='Max'
          value={value.max ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              max: e.target.value === '' ? null : Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  )
}

export function TableToolbar<T>({
  spec, data, filters, onFiltersChange, visibility, onVisibilityChange,
  view = 'table', onViewChange,
}: TableToolbarProps<T>) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const quick = spec.columns.filter((c) => c.filter === 'quick')
  const more = spec.columns.filter((c) => c.filter === 'more')
  const searchCol = spec.columns.find(
    (c) => c.type === 'string' && c.required === true
  )
  const activeCount = countActiveFilters(filters)

  const valueFor = (c: ColumnSpec<T>): FilterValue =>
    filters[c.id] ?? emptyFilterFor(c.type)

  const set = (id: string, v: FilterValue) => {
    const next = { ...filters }
    if (isFilterActive(v)) next[id] = v
    else delete next[id]
    onFiltersChange(next)
  }

  return (
    <div className='flex flex-wrap items-center gap-2 pb-3'>
      {searchCol && (
        <Input
          className='max-w-64'
          placeholder={`Search ${searchCol.header.toLowerCase()}…`}
          value={
            (filters[searchCol.id] as { query?: string } | undefined)?.query ?? ''
          }
          onChange={(e) =>
            set(searchCol.id, { kind: 'text', query: e.target.value })
          }
        />
      )}

      {quick.map((c) => (
        <FacetControl
          key={c.id}
          spec={spec}
          data={data}
          col={c}
          value={valueFor(c) as FacetFilter}
          onChange={(v) => set(c.id, v)}
        />
      ))}

      {more.length > 0 && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant='outline' size='sm'>
              <Funnel className='size-3.5' />
              More filters
              {activeCount > 0 && <Badge variant='open'>{activeCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className='space-y-4 p-6'>
            <SheetHeader>
              <SheetTitle>More filters</SheetTitle>
            </SheetHeader>
            {more.map((c) =>
              c.type === 'number' ? (
                <RangeControl
                  key={c.id}
                  label={c.header}
                  value={valueFor(c) as RangeFilter}
                  onChange={(v) => set(c.id, v)}
                />
              ) : (
                <FacetControl
                  key={c.id}
                  spec={spec}
                  data={data}
                  col={c}
                  value={valueFor(c) as FacetFilter}
                  onChange={(v) => set(c.id, v)}
                />
              )
            )}
            <Button variant='outline' onClick={() => onFiltersChange({})}>
              Clear filters {activeCount > 0 && `(${activeCount})`}
            </Button>
          </SheetContent>
        </Sheet>
      )}

      <div className='ms-auto flex items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Gear className='size-3.5' />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {spec.columns
              .filter((c) => c.detail !== true)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={visibility[c.id] !== false}
                  disabled={c.required === true}
                  onCheckedChange={(on) =>
                    onVisibilityChange({ ...visibility, [c.id]: on })
                  }
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {spec.views && spec.views.length > 0 && onViewChange && (
          <div className='flex items-center rounded-md border'>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size='sm'
              aria-label='Table view'
              onClick={() => onViewChange('table')}
            >
              <TableIcon className='size-3.5' />
            </Button>
            {spec.views.includes('card') && (
              <Button
                variant={view === 'card' ? 'secondary' : 'ghost'}
                size='sm'
                aria-label='Card view'
                onClick={() => onViewChange('card')}
              >
                <SquaresFour className='size-3.5' />
              </Button>
            )}
          </div>
        )}

        {spec.add && (
          <Button onClick={spec.add.onAdd}>
            <Plus className='size-3.5' />
            {spec.add.label}
          </Button>
        )}
      </div>
    </div>
  )
}
