import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
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
import { useRole } from '@/context/role-context'
import {
  LIFECYCLE_MODULES,
  type AuditEvent,
} from '../data/audit'
import { COMPANIES } from '../data/shared'
import { type LifecycleLog } from '../hooks/use-lifecycle-log'
import { SortHeader } from './columns-shared'
import { SectionCard } from './config-widgets'

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const auditColumns: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: ({ column }) => <SortHeader column={column} label='Timestamp' />,
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {timeFmt.format(new Date(row.original.timestamp))}
      </span>
    ),
  },
  {
    accessorKey: 'module',
    header: ({ column }) => <SortHeader column={column} label='Module' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.module}</Badge>,
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <SortHeader column={column} label='Action' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-sm font-medium'>{row.original.action}</span>
        <span className='text-neutral-1000 text-xs'>{row.original.target}</span>
      </div>
    ),
  },
  {
    accessorKey: 'actor',
    header: ({ column }) => <SortHeader column={column} label='Actor' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-sm'>{row.original.actor}</span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.actorRole}
          {row.original.onBehalfOf && ` · on behalf of ${row.original.onBehalfOf}`}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'company',
    header: ({ column }) => <SortHeader column={column} label='Tenant / company' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.company}</span>,
  },
  {
    accessorKey: 'outcome',
    header: ({ column }) => <SortHeader column={column} label='Outcome' />,
    cell: ({ row }) => (
      <span className='text-neutral-1000 max-w-[280px] text-xs'>
        {row.original.outcome}
      </span>
    ),
  },
]

interface AuditTabProps {
  log: LifecycleLog
}

/**
 * Reports + immutable audit trail. Company Admins are tenant-scoped;
 * Group Company Admins report across group companies; Platform Admins see
 * the append-only store guarantees.
 */
export function AuditTab({ log }: AuditTabProps) {
  const { hasRole } = useRole()
  const [module, setModule] = useState('all')
  const [company, setCompany] = useState('all')

  const crossCompany = hasRole('Group Company Admin', 'Platform Admin')
  // Row-level security: company admins only ever see their own tenant.
  const tenantScope = crossCompany ? company : 'Aurora Software India'

  const events = useMemo(
    () =>
      log.events.filter(
        (e) =>
          (module === 'all' || e.module === module) &&
          (tenantScope === 'all' || e.company === tenantScope)
      ),
    [log.events, module, tenantScope]
  )

  const reportCounts = useMemo(() => {
    const count = (m: AuditEvent['module']) =>
      log.events.filter(
        (e) => e.module === m && (tenantScope === 'all' || e.company === tenantScope)
      ).length
    return [
      { label: 'Onboarding events', value: count('Onboarding') },
      { label: 'Probation events', value: count('Probation') },
      { label: 'Transfer events', value: count('Transfer') },
      { label: 'Exit events', value: count('Exit') },
    ]
  }, [log.events, tenantScope])

  return (
    <div className='w-full'>
      <SectionCard
        title='Lifecycle reports'
        description={
          crossCompany
            ? 'Reportable across all companies in the group — figures read from the canonical audit trail.'
            : 'Tenant-scoped reporting for Aurora Software India — figures read from the canonical audit trail.'
        }
        actions={
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.success('Report export queued — data sourced from the audit store')
            }
          >
            Export report
          </Button>
        }
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {reportCounts.map((r) => (
            <div
              key={r.label}
              className='rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <p className='text-paragraph-sm font-medium'>{r.label}</p>
              <p className='text-2xl font-medium'>{r.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Audit trail ({events.length})
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All modules</SelectItem>
              {LIFECYCLE_MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {crossCompany && (
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All group companies</SelectItem>
                {COMPANIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.error(
                'Operation rejected — the audit store is append-only and tamper-evident'
              )
            }
          >
            Try to delete a record
          </Button>
        </div>
      </div>

      <DataTable columns={auditColumns} data={events} variant='no-status' />
    </div>
  )
}
