import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  Eye,
  Info,
  Lightning,
  PencilSimple,
  Plus,
  Timer,
  UploadSimple,
  XCircle,
} from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { UploadModal } from '@/components/common/upload-modal'
import { seedEmployees } from '../data/employees'
import {
  ASSIGNMENT_TRIGGERS,
  LIFECYCLE_EVENTS,
  type AssignmentTrigger,
  type Distribution,
} from '../data/distributions'
import { type PolicyConfigStore } from '../hooks/use-policy-config'
import {
  type DistributionDraft,
  type PolicyDistributionStore,
} from '../hooks/use-policy-distribution'
import { DistributionDetailOverlay } from './distribution-detail-overlay'
import { DistributionSummary } from './distribution-summary'
import {
  distributionsTableColumns,
  type DistributionRow,
} from './distributions-table-columns'
import { NewDistributionOverlay } from './new-distribution-overlay'

interface DistributionsTabProps {
  store: PolicyDistributionStore
  config: PolicyConfigStore
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Plain-language explainer of the five re-acknowledgment triggers. */
const REACK_EXPLAINER: { trigger: AssignmentTrigger; copy: string }[] = [
  {
    trigger: 'Content change',
    copy: 'The policy text was updated, so earlier confirmations no longer cover the new wording.',
  },
  {
    trigger: 'Periodic renewal',
    copy: 'Some policies must be confirmed again on a schedule — for example every year — even if nothing changed.',
  },
  {
    trigger: 'Transfer',
    copy: 'Moving to a different office or company can bring different rules, so the policy is asked for again.',
  },
  {
    trigger: 'Role change',
    copy: 'A new role can change which rules apply, so a fresh confirmation is requested.',
  },
  {
    trigger: 'Regulatory update',
    copy: 'A law or regulation changed. These waves are marked priority and carry a shorter deadline.',
  },
]

function ReAckExplainer() {
  return (
    <div className='border-gray-200 mb-3 rounded-[6px] border bg-white px-4 py-3'>
      <p className='text-neutral-1600 mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
        <Info size={15} className='text-blue-1400' />
        When is re-acknowledgment required?
      </p>
      <ul className='space-y-1'>
        {REACK_EXPLAINER.map(({ trigger, copy }) => (
          <li key={trigger} className='text-paragraph-sm text-neutral-1000'>
            <span className='text-neutral-1600 font-medium'>{trigger}</span> —{' '}
            {copy}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Metadata-driven management console: distribution grid with aggregate
 * acknowledgment status, drill-down, scheduling controls, SLA sweep and
 * lifecycle-event simulation.
 */
export function DistributionsTab({ store, config }: DistributionsTabProps) {
  const { role } = useRole()
  const actorLabel = `Asha Verma (${role})`

  const [selectedRows, setSelectedRows] = useState<DistributionRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Distribution | null>(null)
  const [detail, setDetail] = useState<Distribution | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [triggerFilter, setTriggerFilter] = useState<'all' | AssignmentTrigger>(
    'all'
  )

  const rows = useMemo<DistributionRow[]>(
    () =>
      store.distributions
        .filter((d) => triggerFilter === 'all' || d.trigger === triggerFilter)
        .map((d) => {
          const list = store.assignments.filter(
            (a) => a.distributionId === d.id && !a.superseded
          )
          return {
            ...d,
            agg: {
              total: list.length,
              acknowledged: list.filter((a) => a.status === 'Acknowledged')
                .length,
              pending: list.filter((a) => a.status === 'Pending').length,
              overdue: list.filter((a) => a.status === 'Overdue').length,
              failed: list.filter((a) => a.status === 'Failed').length,
            },
          }
        }),
    [store.distributions, store.assignments, triggerFilter]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const selected = selectedRows[0] ?? null
  const canEditSelected =
    selectedRows.length === 1 && selected !== null && selected.sentAt === null

  const handleSubmit = (draft: DistributionDraft) => {
    if (editing) {
      store.updateDistribution(editing.id, draft)
      toast.success('Distribution updated (still queued)')
    } else {
      const created = store.createDistribution(draft, actorLabel)
      if (created) {
        toast.success(
          created.status === 'Sent'
            ? `“${created.policyTitle}” distributed`
            : created.status === 'Scheduled'
              ? `“${created.policyTitle}” scheduled`
              : `Event trigger armed for “${created.policyTitle}”`
        )
      }
    }
    setEditing(null)
    clearSelection()
  }

  const onConfirmCancel = () => {
    if (selected) {
      store.cancelDistribution(selected.id)
      toast.success('Distribution cancelled before send')
    }
    setConfirmCancel(false)
    clearSelection()
  }

  return (
    <>
      <DistributionSummary
        distributions={store.distributions}
        assignments={store.assignments}
      />

      <ReAckExplainer />

      {/* Policies whose acknowledgments aged past their renewal cadence. */}
      {store.renewalDue.length > 0 && (
        <div className='border-orange-1200/40 bg-orange-1200/5 mb-3 rounded-[6px] border px-4 py-3'>
          <p className='text-neutral-1600 mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
            <ArrowsClockwise size={15} className='text-orange-1200' />
            Renewal due
          </p>
          <div className='space-y-2'>
            {store.renewalDue.map((item) => (
              <div
                key={item.policy.id}
                className='flex flex-wrap items-center justify-between gap-2'
              >
                <p className='text-paragraph-sm text-neutral-1000'>
                  <span className='text-neutral-1600 font-medium'>
                    {item.policy.title}
                  </span>{' '}
                  renews {item.policy.renewalCadence.toLowerCase()} — last
                  acknowledged {dateFmt.format(new Date(item.lastAcknowledgedAt))}
                  ; {item.employeeCount} employee(s) need to acknowledge again.
                </p>
                {role === 'Company Admin' ? (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      store.startRenewalWave(item.policy.id, actorLabel)
                    }
                  >
                    <ArrowsClockwise size={14} weight='bold' />
                    Start renewal wave
                  </Button>
                ) : (
                  <span className='text-paragraph-sm text-neutral-1000'>
                    Company Admin starts the renewal wave
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Distributions ({rows.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Select
            value={triggerFilter}
            onValueChange={(v) => setTriggerFilter(v as 'all' | AssignmentTrigger)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All triggers</SelectItem>
              {ASSIGNMENT_TRIGGERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='icon2'
            onClick={() => store.runSlaSweep(config.reminderRules)}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Run SLA sweep'
            title='Run SLA sweep — reminders, overdue marking, escalations'
          >
            <Timer size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setImportOpen(true)}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Bulk distribution import'
            title='Bulk distribution — import recipient file (CSV / XLS)'
          >
            <UploadSimple size={16} weight='bold' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label='Simulate lifecycle event'
                title='Simulate a lifecycle event'
              >
                <Lightning size={16} weight='bold' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[240px]'>
              <DropdownMenuLabel>Simulate lifecycle event</DropdownMenuLabel>
              <DropdownMenuSeparator className='my-0' />
              {LIFECYCLE_EVENTS.map((event) => (
                <DropdownMenuItem
                  key={event}
                  onClick={() =>
                    store.simulateLifecycleEvent(
                      event,
                      event === 'Onboarding' ? 'emp-114' : 'emp-101',
                      config.enabledReAckTriggers
                    )
                  }
                >
                  {event} —{' '}
                  {
                    seedEmployees.find(
                      (e) =>
                        e.id === (event === 'Onboarding' ? 'emp-114' : 'emp-101')
                    )?.name
                  }
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant='icon2'
            onClick={() => selected && setDetail(selected)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='View details'
            title='View recipient grid'
          >
            <Eye size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => {
              if (canEditSelected && selected) {
                setEditing(selected)
                setOverlayOpen(true)
              }
            }}
            className='text-neutral-1900 h-7 w-7'
            disabled={!canEditSelected}
            aria-label='Edit'
            title='Edit (scheduled/armed only)'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setConfirmCancel(true)}
            className='text-neutral-1900 h-7 w-7'
            disabled={!canEditSelected}
            aria-label='Cancel distribution'
            title='Cancel (before send only)'
          >
            <XCircle size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOverlayOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Distribution
          </Button>
        </div>
      </div>

      <DataTable
        columns={distributionsTableColumns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(selection) => setSelectedRows(selection)}
        onRowClick={(row) => setDetail(row)}
      />

      <UploadModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title='Bulk distribution (CSV / XLS)'
        onUpload={(file) => store.importBulkDistribution(file, actorLabel)}
      />

      <NewDistributionOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        distribution={editing}
        onSubmit={handleSubmit}
      />

      {detail && (
        <DistributionDetailOverlay
          distribution={
            store.distributions.find((d) => d.id === detail.id) ?? null
          }
          onOpenChange={(open) => {
            if (!open) setDetail(null)
          }}
          store={store}
          actorLabel={actorLabel}
        />
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this distribution?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? `“${selected.policyTitle}” has not been sent yet. Cancelling removes it from the queue — no recipients will be notified.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmCancel}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Cancel distribution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
