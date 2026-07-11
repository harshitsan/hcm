import { useMemo, useState } from 'react'
import { PencilSimple, Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import type { Application } from '../data/candidates'
import type { CustomFieldDef } from '../data/config'
import {
  HIRING_AS,
  HIRING_MANAGERS,
  RECRUITERS,
  REQUISITION_STATUSES,
  type Requisition,
} from '../data/requisitions'
import type { RequisitionsStore } from '../hooks/use-requisitions'
import { StatusBadge } from './badges'
import { BulkRequisitionDialog } from './bulk-requisition-dialog'
import { requisitionColumns } from './requisition-columns'
import { RequisitionOverlay } from './requisition-overlay'

interface RequisitionsTabProps {
  store: RequisitionsStore
  customFields: CustomFieldDef[]
  applications: Application[]
}

/**
 * Requisition desk — creation, submission, multi-level approval, status
 * tracking/filtering, ownership assignment and effective-dated history
 * (TA-01…TA-04, TA-22, TA-24).
 */
export function RequisitionsTab({
  store,
  customFields,
  applications,
}: RequisitionsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [hiringAsFilter, setHiringAsFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Requisition[]>([])
  const [resetKey, setResetKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Requisition | null>(null)
  const [decisionOpen, setDecisionOpen] = useState<'approved' | 'rejected' | null>(null)
  const [decisionComment, setDecisionComment] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [recruiter, setRecruiter] = useState<string>(RECRUITERS[0])
  const [hiringManager, setHiringManager] = useState<string>(HIRING_MANAGERS[0])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const rows = useMemo(
    () =>
      store.requisitions.filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (hiringAsFilter === 'all' || r.hiringAs === hiringAsFilter)
      ),
    [store.requisitions, statusFilter, hiringAsFilter]
  )

  const one = selected.length === 1 ? selected[0] : null
  const clear = () => {
    setSelected([])
    setResetKey((k) => k + 1)
  }

  const decide = () => {
    if (!one || !decisionOpen) return
    store.decideApproval(one.id, decisionOpen, decisionComment)
    setDecisionOpen(null)
    setDecisionComment('')
    clear()
  }

  const hasActiveApps = (id: string) =>
    applications.some(
      (a) =>
        a.requisitionId === id &&
        !['rejected', 'cancelled', 'hired'].includes(a.status)
    )

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-3'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Job Requisitions ({rows.length})
          </h2>
          {/* TA-03: filter by status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {REQUISITION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* RL-04: filter by hiring type (New Join / Replacement) */}
          <Select value={hiringAsFilter} onValueChange={setHiringAsFilter}>
            <SelectTrigger className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All hiring types</SelectItem>
              {HIRING_AS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <RoleGate roles={['Company Admin', 'Group Company Admin']}>
            <Button
              variant='outline'
              className='h-7 gap-1'
              onClick={() => setBulkOpen(true)}
            >
              <Plus size={10} weight='bold' />
              Create Bulk Requisition
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
              New Requisition
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Row actions appear only once a requisition is selected — the
          applicable ones stay enabled based on the selected row's status */}
      {selected.length > 0 ? (
        <div className='mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
          <span className='text-sm font-medium'>
            {selected.length} selected
            {selected.length > 1 && ' — actions apply to one requisition at a time'}
          </span>
          <Button
            variant='outline'
            className='h-7'
            disabled={!one}
            onClick={() => setHistoryOpen(true)}
          >
            History
          </Button>
          <RoleGate roles={['Company Admin', 'Group Company Admin']}>
            <Button
              variant='outline'
              className='h-7'
              disabled={!one || one.status !== 'draft'}
              onClick={() => {
                if (one) {
                  store.submitRequisition(one.id)
                  clear()
                }
              }}
            >
              Submit for approval
            </Button>
            <Button
              variant='outline'
              className='h-7'
              disabled={!one || one.status !== 'pending-approval'}
              onClick={() => setDecisionOpen('approved')}
            >
              Approve
            </Button>
            <Button
              variant='outline'
              className='h-7'
              disabled={!one || one.status !== 'pending-approval'}
              onClick={() => setDecisionOpen('rejected')}
            >
              Reject
            </Button>
            <Button
              variant='outline'
              className='h-7'
              disabled={
                !one || !['approved', 'sourcing'].includes(one.status)
              }
              onClick={() => setAssignOpen(true)}
            >
              Assign
            </Button>
            {/* Withdraw — allowed from any stage by requester/approver */}
            <Button
              variant='outline'
              className='h-7'
              disabled={
                !one ||
                ['withdrawn', 'closed', 'cancelled'].includes(one.status)
              }
              onClick={() => {
                if (one) {
                  store.withdrawRequisition(
                    one.id,
                    one.hiringManager ?? 'Requester'
                  )
                  clear()
                }
              }}
            >
              Withdraw
            </Button>
            {/* Resubmit — restarts the workflow for rejected RRFs */}
            <Button
              variant='outline'
              className='h-7'
              disabled={!one || one.status !== 'rejected'}
              onClick={() => {
                if (one) {
                  store.resubmitRequisition(one.id)
                  clear()
                }
              }}
            >
              Resubmit
            </Button>
            <Button
              variant='outline'
              className='h-7'
              disabled={!one}
              onClick={() => {
                if (one) {
                  store.deleteRequisition(one.id, hasActiveApps(one.id))
                  clear()
                }
              }}
            >
              Delete
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Edit'
              disabled={!one}
              onClick={() => {
                setEditing(one)
                setOverlayOpen(true)
              }}
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
          </RoleGate>
          <Button variant='outline' className='h-7 ml-auto' onClick={clear}>
            Clear selection
          </Button>
        </div>
      ) : (
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Select a requisition to see its actions (submit, approve, assign,
          withdraw, history…).
        </p>
      )}

      <DataTable
        columns={requisitionColumns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetKey}
        onSelectionChange={setSelected}
      />
      {/* Count cue — the table body scrolls, so make X-of-Y explicit */}
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Showing {rows.length} of {store.requisitions.length} requisitions
        {statusFilter !== 'all' || hiringAsFilter !== 'all'
          ? ' (filters applied)'
          : ''}
        {rows.length > 8 ? ' — scroll within the table to view all rows' : ''}
      </p>

      <RequisitionOverlay
        open={overlayOpen}
        onOpenChange={(o) => {
          setOverlayOpen(o)
          if (!o) setEditing(null)
        }}
        requisition={editing}
        customFields={customFields}
        store={store}
        onSubmit={(draft) => {
          if (editing) store.updateRequisition(editing.id, draft)
          else store.addRequisition(draft)
          clear()
        }}
      />

      {/* Bulk RRF entry grid with optional self-approval */}
      <BulkRequisitionDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        store={store}
      />

      {/* TA-02: approval decision with comments/justification */}
      <Dialog
        open={decisionOpen !== null}
        onOpenChange={(o) => !o && setDecisionOpen(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {decisionOpen === 'approved' ? 'Approve' : 'Reject'} {one?.id}
            </DialogTitle>
          </DialogHeader>
          {one && (
            <div className='space-y-3'>
              <div className='space-y-1 text-sm'>
                {one.approvals.map((a) => (
                  <div
                    key={a.level}
                    className='flex items-center justify-between rounded border border-gray-200 px-2 py-1.5'
                  >
                    <span className='text-neutral-1900'>
                      L{a.level} · {a.approver} ({a.approverRole})
                    </span>
                    <StatusBadge
                      status={a.decision === 'pending' ? 'pending' : a.decision}
                    />
                  </div>
                ))}
              </div>
              <Textarea
                placeholder='Comments / justification (captured in the audit trail)'
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setDecisionOpen(null)}>
              Cancel
            </Button>
            <Button onClick={decide}>
              Record {decisionOpen === 'approved' ? 'approval' : 'rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TA-04: recruiter + hiring manager assignment */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Assign ownership — {one?.id}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Recruiter</p>
              <Select value={recruiter} onValueChange={setRecruiter}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECRUITERS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Hiring manager</p>
              <Select value={hiringManager} onValueChange={setHiringManager}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HIRING_MANAGERS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (one) store.assignOwners(one.id, recruiter, hiringManager)
                setAssignOpen(false)
                clear()
              }}
            >
              Save assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TA-22: effective-dated history viewer */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className='sm:max-w-[540px]'>
          <DialogHeader>
            <DialogTitle>Effective-dated history — {one?.id}</DialogTitle>
          </DialogHeader>
          <div className='max-h-[360px] space-y-1.5 overflow-y-auto'>
            {one && one.history.length === 0 && (
              <p className='text-neutral-1000 text-sm'>No changes recorded yet.</p>
            )}
            {one?.history
              .slice()
              .reverse()
              .map((h) => (
                <div
                  key={h.id}
                  className='rounded border border-gray-200 px-3 py-2 text-sm'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-neutral-1600 font-medium'>
                      {h.change}
                    </span>
                    <span className='text-neutral-1000 text-paragraph-sm'>
                      {h.validFrom} → {h.validTo ?? 'current'}
                    </span>
                  </div>
                  <p className='text-neutral-1000 text-paragraph-sm'>
                    by {h.actor} · prior versions preserved, queryable as-of any
                    date
                  </p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
