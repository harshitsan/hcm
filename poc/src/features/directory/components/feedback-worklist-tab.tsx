import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { ArrowRight, FunnelSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type Employee, type EmploymentStatus } from '../data/directory'
import {
  NEXT_WORKLIST_STATUS,
  type FeedbackWorklistEntry,
} from '../data/feedback-worklist'
import { SELF_EMPLOYEE_ID, SELF_EMPLOYEE_NAME } from '../data/timeline'
import { type DirectoryStore } from '../hooks/use-directory'
import {
  advanceFeedbackEntry,
  useFeedbackWorklist,
} from '../hooks/use-feedback-worklist'
import { EmploymentStatusBadge } from './directory-badges'
import {
  AnonymousBadge,
  WorklistCategoryBadge,
  WorklistStatusBadge,
} from './feedback-badges'

type EmployeeStatusFilter = 'all' | 'active' | 'inactive'

/** Resolved submitter identity for one worklist row. */
interface Submitter {
  name: string
  department: string
  employmentStatus: EmploymentStatus
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
 * HR-admin feedback / grievance worklist (EFG-05): entries come from the
 * shared module store — the same queue the employee "My Feedback" tab
 * submits into — and resolve their submitter against the directory, so the
 * queue can be narrowed to Active or Inactive employees and to a specific
 * "Raised by" submitter. Entries carry a simple review status flow so triage
 * is demonstrable end to end; anonymous submissions withhold the identity.
 */
export function FeedbackWorklistTab({ store }: { store: DirectoryStore }) {
  const entries = useFeedbackWorklist()
  const [employeeStatus, setEmployeeStatus] =
    useState<EmployeeStatusFilter>('all')
  const [raisedBy, setRaisedBy] = useState('all')

  /**
   * Resolves a submitter: directory employees by id, the signed-in mock
   * employee via `SELF_EMPLOYEE_ID`, and anonymous entries as undefined.
   */
  const resolveSubmitter = useCallback(
    (entry: FeedbackWorklistEntry): Submitter | undefined => {
      if (entry.anonymous) return undefined
      if (entry.raisedById === SELF_EMPLOYEE_ID) {
        return {
          name: SELF_EMPLOYEE_NAME,
          department: 'Self-service',
          employmentStatus: 'active',
        }
      }
      const employee = store.employeeById.get(entry.raisedById)
      if (!employee) return undefined
      return {
        name: employee.name,
        department: employee.department,
        employmentStatus: employee.employmentStatus,
      }
    },
    [store.employeeById]
  )

  // Submitters that actually raised something (anonymous entries excluded).
  const submitters = useMemo(() => {
    const ids = [
      ...new Set(entries.filter((e) => !e.anonymous).map((e) => e.raisedById)),
    ]
    return ids
      .map((id) => {
        if (id === SELF_EMPLOYEE_ID) {
          return { id, name: SELF_EMPLOYEE_NAME, inactive: false }
        }
        const employee = store.employeeById.get(id)
        if (!employee) return null
        return {
          id,
          name: employee.name,
          inactive: employee.employmentStatus === 'inactive',
        }
      })
      .filter((s): s is { id: string; name: string; inactive: boolean } =>
        s !== null
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [entries, store.employeeById])

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        // Anonymous submitters are always current employees; the self
        // persona is active by definition.
        const active = entry.anonymous
          ? true
          : entry.raisedById === SELF_EMPLOYEE_ID
            ? true
            : isActiveSubmitter(store.employeeById.get(entry.raisedById))
        if (employeeStatus === 'active' && !active) return false
        if (employeeStatus === 'inactive' && active) return false
        if (raisedBy !== 'all') {
          if (entry.anonymous) return false
          if (entry.raisedById !== raisedBy) return false
        }
        return true
      }),
    [entries, employeeStatus, raisedBy, store.employeeById]
  )

  const advance = useCallback((entry: FeedbackWorklistEntry) => {
    const updated = advanceFeedbackEntry(entry.id)
    if (updated) toast.success(`${entry.code} moved to ${updated.status}`)
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
          if (row.original.anonymous) {
            return (
              <div className='flex min-w-[180px] items-center gap-2'>
                <AnonymousBadge />
                <span className='text-neutral-1000 text-xs'>
                  Identity withheld
                </span>
              </div>
            )
          }
          const submitter = resolveSubmitter(row.original)
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
          <WorklistCategoryBadge category={row.original.category} />
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ row }) => (
          <div className='min-w-[220px]'>
            <p className='text-sm'>{row.original.subject}</p>
            {row.original.description && (
              <p className='text-paragraph-sm text-neutral-1000 max-w-[380px] truncate'>
                {row.original.description}
              </p>
            )}
          </div>
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
        cell: ({ row }) => <WorklistStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const next = NEXT_WORKLIST_STATUS[row.original.status]
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
    [resolveSubmitter, advance]
  )

  const inactiveCount = useMemo(
    () =>
      entries.filter(
        (e) =>
          !e.anonymous &&
          e.raisedById !== SELF_EMPLOYEE_ID &&
          !isActiveSubmitter(store.employeeById.get(e.raisedById))
      ).length,
    [entries, store.employeeById]
  )

  return (
    <div className='w-full'>
      <p className='text-blue-1400 bg-blue-150 mb-3 rounded-md px-3 py-2 text-xs'>
        Feedback and grievances raised by employees (via the self-service My
        Feedback form), resolved against the directory. Narrow the queue to
        Active or Inactive submitters — exited employees ({inactiveCount} entr
        {inactiveCount === 1 ? 'y' : 'ies'} in queue) often have pending
        settlement grievances — or pick a specific submitter. Anonymous
        entries keep the submitter's identity withheld.
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
                {s.inactive ? ' (inactive)' : ''}
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
