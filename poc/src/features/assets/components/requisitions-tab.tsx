import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { type Acknowledgement } from '../data/acknowledgements'
import {
  REQUISITION_STATUSES,
  type Requisition,
} from '../data/requisitions'
import {
  CURRENT_ADMIN,
  DEPARTMENTS,
  EMPLOYEES,
  HOME_COMPANY,
  SELF_EMPLOYEE_ID,
  employeeName,
  todayIso,
} from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { type RequisitionsStore } from '../hooks/use-requisitions'
import { AckDialog } from './ack-dialog'
import { AssignDialog } from './assign-dialog'
import { RequisitionFormOverlay } from './requisition-form-overlay'
import { requisitionColumns } from './requisition-columns'

interface RequisitionsTabProps {
  reqStore: RequisitionsStore
  assetsStore: AssetsStore
  config: AssetConfigStore
}

/**
 * Requisition surface (ASM-27..31, ASM-42): Employee (User) sees "My Asset
 * Requisition List" with raise/withdraw/track; Company Admin sees the team
 * queue with Pending-with-me, approve/reject and (partial) assignment.
 */
export function RequisitionsTab({ reqStore, assetsStore, config }: RequisitionsTabProps) {
  const { role } = useRole()
  const isAdmin = role === 'Company Admin'

  const [selectedRows, setSelectedRows] = useState<Requisition[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Requisition | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Requisition | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [ackTarget, setAckTarget] = useState<Acknowledgement | null>(null)

  const [statusFilter, setStatusFilter] = useState('All')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [pendingWithMe, setPendingWithMe] = useState(false)

  const base = useMemo(
    () =>
      isAdmin
        ? reqStore.requisitions
        : reqStore.requisitions.filter((r) => r.requesterId === SELF_EMPLOYEE_ID),
    [reqStore.requisitions, isAdmin]
  )

  const filtered = useMemo(
    () =>
      base.filter((r) => {
        if (statusFilter !== 'All' && r.status !== statusFilter) return false
        if (fromFilter && r.requestedOn < fromFilter) return false
        if (toFilter && r.requestedOn > toFilter) return false
        if (deptFilter !== 'All' && r.department !== deptFilter) return false
        if (pendingWithMe && r.pendingWith !== CURRENT_ADMIN) return false
        return true
      }),
    [base, statusFilter, fromFilter, toFilter, deptFilter, pendingWithMe]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const singleLive = single
    ? (reqStore.requisitions.find((r) => r.id === single.id) ?? null)
    : null

  const columns = useMemo(() => requisitionColumns(isAdmin), [isAdmin])

  /** Pending receipt acknowledgement task on my issued requisition (ASM-29). */
  const myPendingAck = useMemo(() => {
    if (isAdmin || !singleLive) return null
    return (
      assetsStore.acknowledgements.find(
        (k) =>
          k.status === 'Pending' &&
          k.employeeId === SELF_EMPLOYEE_ID &&
          singleLive.assignedAssetIds.includes(k.assetId)
      ) ?? null
    )
  }, [isAdmin, singleLive, assetsStore.acknowledgements])

  const assignableStock = useMemo(() => {
    if (!assignTarget) return []
    return assetsStore.assets.filter(
      (a) =>
        a.company === HOME_COMPANY && a.state === 'Available' && a.category === assignTarget.category
    )
  }, [assignTarget, assetsStore.assets])

  const handleAssign = (requisition: Requisition, units: typeof assignableStock) => {
    reqStore.assignAssets(
      requisition.id,
      units.map((u) => u.id),
      units.map((u) => u.assetTag)
    )
    units.forEach((u) =>
      assetsStore.runTransaction(u.id, 'issue', {
        employeeId: requisition.requesterId,
        effectiveDate: todayIso(),
        expectedReturnDate: requisition.returnBefore,
        note: `Issued against requisition ${requisition.number}`,
      })
    )
    clearSelection()
  }

  const handleReject = () => {
    if (!rejectTarget) return
    if (rejectReason.trim().length < 3) {
      toast.error('A rejection reason is required')
      return
    }
    reqStore.rejectRequisition(rejectTarget.id, rejectReason.trim())
    setRejectTarget(null)
    setRejectReason('')
    clearSelection()
  }

  return (
    <div className='w-full'>
      <div className='border-grey-200 mb-3 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='h-7! w-[210px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All statuses</SelectItem>
              {REQUISITION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='req-from' className='text-paragraph-sm'>
            Period from
          </Label>
          <Input
            id='req-from'
            type='date'
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='req-to' className='text-paragraph-sm'>
            Period to
          </Label>
          <Input
            id='req-to'
            type='date'
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        {isAdmin && (
          <>
            <div className='flex flex-col gap-1'>
              <Label className='text-paragraph-sm'>Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className='h-7! w-[160px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='All'>All departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='mb-1 flex items-center gap-2'>
              <Switch id='req-pwm' checked={pendingWithMe} onCheckedChange={setPendingWithMe} />
              <Label htmlFor='req-pwm' className='text-paragraph-sm'>
                Pending with me
              </Label>
            </div>
          </>
        )}
        <div className='ms-auto'>
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5'
            onClick={() => {
              setStatusFilter('All')
              setFromFilter('')
              setToFilter('')
              setDeptFilter('All')
              setPendingWithMe(false)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          {isAdmin ? 'Employee Asset Requisitions' : 'My Asset Requisitions'} ({filtered.length})
        </h2>
        <div className='flex items-center gap-3'>
          {isAdmin ? (
            <>
              <Button
                variant='outline'
                className='h-7 rounded-[6px] px-2.5'
                disabled={!singleLive || singleLive.status !== 'Pending Approval'}
                onClick={() => {
                  if (singleLive) {
                    reqStore.approveRequisition(singleLive.id)
                    clearSelection()
                  }
                }}
              >
                Approve
              </Button>
              <Button
                variant='outline'
                className='h-7 rounded-[6px] px-2.5'
                disabled={!singleLive || singleLive.status !== 'Pending Approval'}
                onClick={() => setRejectTarget(singleLive)}
              >
                Reject
              </Button>
              <Button
                variant='outline'
                className='h-7 rounded-[6px] px-2.5'
                disabled={
                  !singleLive ||
                  (singleLive.status !== 'Pending for Issuance' &&
                    singleLive.status !== 'Pending for Partial Issuance')
                }
                onClick={() => setAssignTarget(singleLive)}
              >
                Assign assets
              </Button>
            </>
          ) : (
            <>
              {myPendingAck && (
                <Button
                  className='h-7 rounded-[6px] px-2.5'
                  onClick={() => setAckTarget(myPendingAck)}
                >
                  Complete {myPendingAck.type.toLowerCase()} acknowledgement
                </Button>
              )}
              <Button
                variant='outline'
                className='h-7 rounded-[6px] px-2.5'
                disabled={!singleLive}
                onClick={() => {
                  if (singleLive) {
                    reqStore.withdrawRequisition(singleLive.id)
                    clearSelection()
                  }
                }}
              >
                Withdraw
              </Button>
            </>
          )}
          <Button
            variant='red'
            onClick={() => setFormOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            {isAdmin ? 'New (on behalf)' : 'New Requisition'}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <RequisitionFormOverlay
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={config.categories}
        adminMode={isAdmin}
        employees={EMPLOYEES.filter((e) => e.company === HOME_COMPANY && e.active)}
        onSubmit={(draft) => {
          reqStore.raiseRequisition(
            draft,
            isAdmin ? CURRENT_ADMIN : null,
            config.approverFor('Requisition')
          )
          clearSelection()
        }}
      />

      <AssignDialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }}
        requisition={assignTarget}
        availableAssets={assignableStock}
        onAssign={handleAssign}
      />

      <AckDialog
        open={ackTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAckTarget(null)
        }}
        ack={ackTarget}
        questionnaireVersions={config.questionnaireVersions}
        recordedBy={employeeName(SELF_EMPLOYEE_ID)}
        onBehalf={false}
        onSubmit={(ackId, responses) =>
          assetsStore.completeAcknowledgement(ackId, responses, employeeName(SELF_EMPLOYEE_ID), false)
        }
      />

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null)
        }}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.number}?</DialogTitle>
            <DialogDescription>
              No asset will be allocated. The requester is notified with your reason and the
              decision is logged with actor and timestamp.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder='Reason for rejection (required)'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
