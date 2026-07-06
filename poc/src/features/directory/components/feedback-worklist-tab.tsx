import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { ArrowRight, FunnelSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type Employee } from '../data/directory'
import {
  seedWorklistEntries,
  type FeedbackWorklistEntry,
  type WorklistCategory,
  type WorklistStatus,
} from '../data/feedback-worklist'
import { type DirectoryStore } from '../hooks/use-directory'
import { EmploymentStatusBadge } from './directory-badges'

type EmployeeStatusFilter = 'all' | 'active' | 'inactive'

const CATEGORY_VARIANT: Record<
  WorklistCategory,
  'dropped' | 'open' | 'secondary'
> = {
  Grievance: 'dropped',
  Feedback: 'open',
  Suggestion: 'secondary',
}

const STATUS_VARIANT: Record<
  WorklistStatus,
  'pending' | 'overdue' | 'badge_active' | 'badge_inactive'
> = {
  Submitted: 'pending',
  'Under Review': 'overdue',
  Resolved: 'badge_active',
  Closed: 'badge_inactive',
}

const NEXT_STATUS: Partial<Record<WorklistStatus, WorklistStatus>> = {
  Submitted: 'Under Review',
  'Under Review': 'Resolved',
  Resolved: 'Closed',
}

/** An employee counts as Active unless the record is deactivated. */
function isActiveSubmitter(employee: Employee | undefined) {
  return employee !== undefined && employee.employmentStatus !== 'inactive'
}

function sortableHeader(label: string) {
  const Header: ColumnDef<FeedbackWorklistEntry>['header'] = ({ column }) => (
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
 * HR-admin feedback / grievance worklist (EFG-05): every entry resolves its
 * submitter against the directory, so the queue can be narrowed to Active or
 * Inactive employees and to a specific "Raised by" submitter. Entries carry a
 * simple review status flow so triage is demonstrable end to end.
 */
export function FeedbackWorklistTab({ store }: { store: DirectoryStore }) {
  const [entries, setEntries] = useState<FeedbackWorklistEntry[]>(
    seedWorklistEntries
  )
  const [employeeStatus, setEmployeeStatus] =
    useState<EmployeeStatusFilter>('all')
  const [raisedBy, setRaisedBy] = useState('all')

  // Submitters that actually raised something, resolved from the directory.
  const submitters = useMemo(() => {
    const ids = [...new Set(entries.map((e) => e.raisedById))]
    return ids
      .map((id) => store.employeeById.get(id))
      .filter((e): e is Employee => e !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [entries, store.employeeById])

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const submitter = store.employeeById.get(entry.raisedById)
        if (employeeStatus === 'active' && !isActiveSubmitter(submitter)) {
          return false
        }
        if (employeeStatus === 'inactive' && isActiveSubmitter(submitter)) {
          return false
        }
        if (raisedBy !== 'all' && entry.raisedById !== raisedBy) return false
        return true
      }),
    [entries, employeeStatus, raisedBy, store.employeeById]
  )

  const advance = useCallback((entry: FeedbackWorklistEntry) => {
    const next = NEXT_STATUS[entry.status]
    if (!next) return
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e))
    )
    toast.success(`${entry.code} moved to ${next}`)
  }, [])

  const columns = useMemo<ColumnDef<FeedbackWorklistEntry>[]>(
    () => [
      {
        accessorKey: 'code',
        header: sortableHeader('Ref'),
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm font-medium'>
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'raisedById',
        header: sortableHeader('Raised by'),
        cell: ({ row }) => {
          const submitter = store.employeeById.get(row.original.raisedById)
          if (!submitter) {
            return <span className='text-neutral-1000 text-sm'>Unknown</span>
          }
          return (
            <div className='flex min-w-[180px] items-center gap-2'>
              <div>
                <p className='text-neutral-1900 text-sm'>{submitter.name}</p>
                <p className='text-neutral-1000 text-xs'>
                  {submitter.department}
                </p>
              </div>
              <EmploymentStatusBadge status={submitter.employmentStatus} />
            </div>
          )
        },
      },
      {
        accessorKey: 'category',
        header: sortableHeader('Category'),
        cell: ({ row }) => (
          <Badge variant={CATEGORY_VARIANT[row.original.category]}>
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.subject}</span>
        ),
      },
      {
        accessorKey: 'submittedOn',
        header: sortableHeader('Submitted'),
        cell: ({ row }) => (
          <span className='text-neutral-1000 text-sm'>
            {row.original.submittedOn}
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
          const next = NEXT_STATUS[row.original.status]
          return (
            <Button
              variant='outline'
              className='h-7 gap-1 px-2 text-xs'
              disabled={!next}
              onClick={() => advance(row.original)}
            >
              {next ? (
                <>
                  <ArrowRight size={13} weight='bold' />
                  Move to {next}
                </>
              ) : (
                'Closed'
              )}
            </Button>
          )
        },
        enableSorting: false,
      },
    ],
    [store.employeeById, advance]
  )

  const inactiveCount = useMemo(
    () =>
      entries.filter(
        (e) => !isActiveSubmitter(store.employeeById.get(e.raisedById))
      ).length,
    [entries, store.employeeById]
  )

  return (
    <div className='w-full'>
      <p className='text-blue-1400 bg-blue-150 mb-3 rounded-md px-3 py-2 text-xs'>
        Feedback and grievances raised by employees, resolved against the
        directory. Narrow the queue to Active or Inactive submitters — exited
        employees ({inactiveCount} entr{inactiveCount === 1 ? 'y' : 'ies'} in
        queue) often have pending settlement grievances — or pick a specific
        submitter.
      </p>

      {/* EFG-05 — Active/Inactive-employee and Raised-by filters. */}
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Worklist ({filtered.length})
        </h2>
        <FunnelSimple size={14} className='text-neutral-1000' />
        <Select
          value={employeeStatus}
          onValueChange={(v) => setEmployeeStatus(v as EmployeeStatusFilter)}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[180px] text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All employees</SelectItem>
            <SelectItem value='active'>Active employees</SelectItem>
            <SelectItem value='inactive'>Inactive employees</SelectItem>
          </SelectContent>
        </Select>
        <Select value={raisedBy} onValueChange={setRaisedBy}>
          <SelectTrigger variant='secondary' className='h-7 w-[200px] text-xs'>
            <SelectValue placeholder='Raised by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Raised by — anyone</SelectItem>
            {submitters.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.employmentStatus === 'inactive' ? ' (inactive)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(employeeStatus !== 'all' || raisedBy !== 'all') && (
          <Button
            variant='ghost'
            className='h-7 px-2 text-xs'
            onClick={() => {
              setEmployeeStatus('all')
              setRaisedBy('all')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} variant='no-status' />
    </div>
  )
}
