import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { MagnifyingGlass, PaperPlaneTilt, XCircle } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/common/data-table/table'
import { seedVacancies, type Vacancy, type VacancyStatus } from '../data/vacancies'

const STATUS_VARIANT: Record<
  VacancyStatus,
  'badge_active' | 'overdue' | 'open'
> = {
  Open: 'badge_active',
  'Closing Soon': 'overdue',
  'On Hold': 'open',
}

function sortableHeader(label: string) {
  const Header: ColumnDef<Vacancy>['header'] = ({ column }) => (
    <Button
      variant='header'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className='text-neutral-2100 size-3.5' />
    </Button>
  )
  return Header
}

/**
 * Internal vacancies board: keyword search over role, department, location
 * and skills (VAC-03) plus an experience From/To range filter in years
 * (VAC-05). Every row shows the vacancy's own experience band, and employees
 * can register interest inline.
 */
export function VacanciesTab() {
  const [keyword, setKeyword] = useState('')
  const [expFrom, setExpFrom] = useState('')
  const [expTo, setExpTo] = useState('')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  const hasFilters = keyword.trim() !== '' || expFrom !== '' || expTo !== ''

  const results = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const from = expFrom === '' ? null : Number(expFrom)
    const to = expTo === '' ? null : Number(expTo)
    return seedVacancies.filter((v) => {
      if (q !== '') {
        const haystack = [
          v.title,
          v.code,
          v.department,
          v.location,
          v.employmentType,
          ...v.skills,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      // Experience overlap: the vacancy's band must intersect [from, to].
      if (from !== null && !Number.isNaN(from) && v.experienceTo < from) {
        return false
      }
      if (to !== null && !Number.isNaN(to) && v.experienceFrom > to) {
        return false
      }
      return true
    })
  }, [keyword, expFrom, expTo])

  const apply = useCallback((vacancy: Vacancy) => {
    setAppliedIds((prev) => new Set(prev).add(vacancy.id))
    toast.success(
      `Interest registered for ${vacancy.title} (${vacancy.code}) — the recruiting team has been notified`
    )
  }, [])

  const clearFilters = () => {
    setKeyword('')
    setExpFrom('')
    setExpTo('')
  }

  const columns = useMemo<ColumnDef<Vacancy>[]>(
    () => [
      {
        accessorKey: 'title',
        header: sortableHeader('Role'),
        cell: ({ row }) => (
          <div className='min-w-[200px]'>
            <p className='text-neutral-1900 text-sm font-medium'>
              {row.original.title}
            </p>
            <p className='text-neutral-1000 text-xs'>
              {row.original.code} · {row.original.skills.join(', ')}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: sortableHeader('Department'),
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.department}</span>
        ),
      },
      {
        accessorKey: 'location',
        header: sortableHeader('Location'),
        cell: ({ row }) => (
          <span className='text-sm'>
            {row.original.location}
            <span className='text-neutral-1000 ml-1 text-xs'>
              ({row.original.employmentType})
            </span>
          </span>
        ),
      },
      {
        // Experience band shown per vacancy (VAC-05).
        accessorKey: 'experienceFrom',
        header: sortableHeader('Experience'),
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {row.original.experienceFrom}–{row.original.experienceTo} yrs
          </Badge>
        ),
      },
      {
        accessorKey: 'openings',
        header: sortableHeader('Openings'),
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.openings}</span>
        ),
      },
      {
        accessorKey: 'postedOn',
        header: sortableHeader('Posted'),
        cell: ({ row }) => (
          <span className='text-neutral-1000 text-sm'>
            {row.original.postedOn}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const applied = appliedIds.has(row.original.id)
          return (
            <Button
              variant='outline'
              className='h-7 gap-1 px-2 text-xs'
              disabled={applied || row.original.status === 'On Hold'}
              onClick={() => apply(row.original)}
            >
              <PaperPlaneTilt size={13} weight='bold' />
              {applied ? 'Interest sent' : "I'm interested"}
            </Button>
          )
        },
        enableSorting: false,
      },
    ],
    [appliedIds, apply]
  )

  return (
    <div className='w-full'>
      <p className='text-blue-1400 bg-blue-150 mb-3 rounded-md px-3 py-2 text-xs'>
        Internal openings across the company. Search by keyword or narrow to
        the experience band that matches your seniority — each vacancy lists
        its required experience range in years.
      </p>

      {/* Keyword search (VAC-03) + experience From/To range filter (VAC-05). */}
      <div className='mb-3 flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
        <div className='flex min-w-[240px] flex-1 flex-col gap-1'>
          <Label htmlFor='vacancy-keyword' className='text-xs'>
            Keyword
          </Label>
          <div className='relative'>
            <MagnifyingGlass
              size={14}
              className='text-neutral-1000 absolute top-1/2 left-2.5 -translate-y-1/2'
            />
            <Input
              id='vacancy-keyword'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='Search role, department, location or skill…'
              className='h-8 pl-8 text-sm'
            />
          </div>
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='vacancy-exp-from' className='text-xs'>
            Experience from (yrs)
          </Label>
          <Input
            id='vacancy-exp-from'
            type='number'
            min={0}
            value={expFrom}
            onChange={(e) => setExpFrom(e.target.value)}
            placeholder='From'
            className='h-8 w-[130px] text-sm'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='vacancy-exp-to' className='text-xs'>
            Experience to (yrs)
          </Label>
          <Input
            id='vacancy-exp-to'
            type='number'
            min={0}
            value={expTo}
            onChange={(e) => setExpTo(e.target.value)}
            placeholder='To'
            className='h-8 w-[130px] text-sm'
          />
        </div>
        {hasFilters && (
          <Button
            variant='ghost'
            className='h-8 gap-1 px-2 text-xs'
            onClick={clearFilters}
          >
            <XCircle size={13} weight='bold' />
            Clear
          </Button>
        )}
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Vacancies ({results.length})
        </h2>
        {hasFilters && (
          <p className='text-neutral-1000 text-xs'>
            {keyword.trim() !== '' && <>keyword “{keyword.trim()}” </>}
            {(expFrom !== '' || expTo !== '') && (
              <>
                · experience {expFrom === '' ? '0' : expFrom}–
                {expTo === '' ? 'any' : expTo} yrs
              </>
            )}
          </p>
        )}
      </div>

      <DataTable columns={columns} data={results} variant='no-status' />
    </div>
  )
}
