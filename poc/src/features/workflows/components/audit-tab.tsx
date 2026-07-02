import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  AUDIT_CATEGORY_LABELS,
  type AuditCategory,
  type AuditEvent,
} from '../data/audit'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'

const CATEGORY_VARIANT: Record<
  AuditCategory,
  'badge_active' | 'badge_inactive' | 'open' | 'pending' | 'overdue' | 'dropped' | 'completed'
> = {
  action: 'open',
  approval: 'badge_active',
  rejection: 'dropped',
  escalation: 'overdue',
  reassignment: 'overdue',
  routing: 'completed',
  reminder: 'pending',
  config: 'badge_inactive',
  security: 'dropped',
}

const columns: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: ({ column }) => <SortableHeader column={column} label='When' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm whitespace-nowrap'>
        {row.original.timestamp}
      </span>
    ),
  },
  {
    id: 'category',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Category</span>
    ),
    cell: ({ row }) => (
      <Badge variant={CATEGORY_VARIANT[row.original.category]}>
        {AUDIT_CATEGORY_LABELS[row.original.category]}
      </Badge>
    ),
  },
  {
    accessorKey: 'summary',
    header: ({ column }) => <SortableHeader column={column} label='Event' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.summary}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.detail}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'actor',
    header: ({ column }) => <SortableHeader column={column} label='Actor' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm'>{row.original.actor}</span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.actorRole}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'company',
    header: ({ column }) => <SortableHeader column={column} label='Company' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
    ),
  },
  {
    accessorKey: 'refId',
    header: ({ column }) => <SortableHeader column={column} label='Ref' />,
    cell: ({ row }) => (
      <code className='text-neutral-1000 text-xs'>{row.original.refId}</code>
    ),
  },
]

/**
 * Complete workflow audit trail (WFE-12, WFE-16, WFE-17): every action,
 * approval, escalation, reassignment, routing decision, SLA reminder, config
 * change and security event with actor, timestamp and detail.
 */
export function AuditTab({
  events,
  companies,
  showPlatformEvents,
}: {
  events: AuditEvent[]
  companies: string[]
  showPlatformEvents: boolean
}) {
  const [category, setCategory] = useState<string>('all')

  const scoped = useMemo(
    () =>
      events.filter(
        (e) =>
          (companies.includes(e.company) ||
            (showPlatformEvents && e.company === 'Platform')) &&
          (category === 'all' || e.category === category)
      ),
    [events, companies, showPlatformEvents, category]
  )

  const summary = useMemo(() => {
    const count = (c: AuditCategory) =>
      scoped.filter((e) => e.category === c).length
    return [
      { label: 'Events in scope', value: scoped.length },
      { label: 'Approvals / rejections', value: count('approval') + count('rejection') },
      {
        label: 'Escalations / reassignments',
        value: count('escalation') + count('reassignment'),
      },
      { label: 'Routing decisions', value: count('routing') },
    ]
  }, [scoped])

  return (
    <div className='w-full'>
      <SummaryCards title='Audit trail' items={summary} />

      <SectionToolbar title={`Audit events (${scoped.length})`}>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            {(Object.keys(AUDIT_CATEGORY_LABELS) as AuditCategory[]).map(
              (c) => (
                <SelectItem key={c} value={c}>
                  {AUDIT_CATEGORY_LABELS[c]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </SectionToolbar>

      <DataTable columns={columns} data={scoped} variant='no-status' />
    </div>
  )
}
