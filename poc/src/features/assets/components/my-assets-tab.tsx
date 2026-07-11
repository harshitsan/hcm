import { useMemo, useState } from 'react'
import { BellRinging, Package, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Acknowledgement } from '../data/acknowledgements'
import { type Asset } from '../data/assets'
import {
  EMPLOYEES,
  HOME_COMPANY,
  SELF_EMPLOYEE_ID,
  employeeName,
  formatDate,
  todayIso,
} from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { type RequisitionsStore } from '../hooks/use-requisitions'
import { daysOverdue } from './asset-columns'
import { AckDialog } from './ack-dialog'
import { RequisitionFormOverlay } from './requisition-form-overlay'
import { AckStatusBadge, AssetStateBadge, OverdueBadge } from './badges'

interface MyAssetsTabProps {
  store: AssetsStore
  config: AssetConfigStore
  reqStore: RequisitionsStore
}

/** Employee-facing statuses derived per asset (AST-03). */
const MY_ASSET_STATUSES = [
  'Acknowledged / Issued',
  'Pending for Receipt Acknowledgement',
  'Pending for Confirm Return',
  'Returned',
] as const

type MyAssetStatus = (typeof MY_ASSET_STATUSES)[number]

const MY_STATUS_VARIANTS: Record<MyAssetStatus, 'completed' | 'pending' | 'overdue' | 'open'> = {
  'Acknowledged / Issued': 'completed',
  'Pending for Receipt Acknowledgement': 'pending',
  'Pending for Confirm Return': 'overdue',
  Returned: 'open',
}

/**
 * Employee self-service (ASM-15): my allocated assets with acknowledgement
 * flags and overdue indicators, templated notifications (ASM-22), pending
 * receipt/return acknowledgements completed via the dynamic condition form
 * (ASM-07/08/24), and receipt-vs-return condition comparison. The list can be
 * narrowed by a From/To period range (AST-02) and by employee-facing status —
 * Acknowledged/Issued, Pending for Receipt Acknowledgement, Pending for
 * Confirm Return, Returned (AST-03) — with a Reset control to clear the
 * selections (AST-04). Each row also surfaces the 'To be returned on' due
 * date so employees can return assets on time (AST-05).
 */
export function MyAssetsTab({ store, config, reqStore }: MyAssetsTabProps) {
  const [ackTarget, setAckTarget] = useState<Acknowledgement | null>(null)
  const [reqFormOpen, setReqFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const today = todayIso()
  const selfName = employeeName(SELF_EMPLOYEE_ID)

  const myAssets = useMemo(
    () => store.assets.filter((a) => a.holderId === SELF_EMPLOYEE_ID),
    [store.assets]
  )
  const myAcks = useMemo(
    () => store.acknowledgements.filter((k) => k.employeeId === SELF_EMPLOYEE_ID),
    [store.acknowledgements]
  )
  const pendingAcks = myAcks.filter((k) => k.status === 'Pending')
  const completedAcks = myAcks.filter((k) => k.status === 'Completed')

  interface MyAssetRow {
    asset: Asset
    myStatus: MyAssetStatus
    pending: Acknowledgement | undefined
    issuedOn: string | null
    /** Business date the From/To period filter is applied against (AST-02). */
    periodDate: string | null
  }

  // My asset list rows: assets I currently hold plus assets I returned,
  // each with an employee-facing status (AST-02/03).
  const rows = useMemo<MyAssetRow[]>(() => {
    const returnedByMe = store.assets.filter(
      (a) =>
        a.holderId !== SELF_EMPLOYEE_ID &&
        a.history.some((e) => e.newState === 'Returned' && e.employee === selfName)
    )
    return [...myAssets, ...returnedByMe].map((asset) => {
      const pending = pendingAcks.find((k) => k.assetId === asset.id)
      const returnedEntry = [...asset.history]
        .reverse()
        .find((e) => e.newState === 'Returned' && e.employee === selfName)
      const myStatus: MyAssetStatus =
        pending?.type === 'Receipt'
          ? 'Pending for Receipt Acknowledgement'
          : pending?.type === 'Return'
            ? 'Pending for Confirm Return'
            : asset.holderId === SELF_EMPLOYEE_ID
              ? 'Acknowledged / Issued'
              : 'Returned'
      const issuedOn =
        asset.issueDate ??
        [...asset.history].reverse().find((e) => e.event.startsWith('Issued'))?.effectiveDate ??
        null
      return {
        asset,
        myStatus,
        pending,
        issuedOn,
        periodDate: asset.issueDate ?? returnedEntry?.effectiveDate ?? issuedOn,
      }
    })
  }, [store.assets, myAssets, pendingAcks, selfName])

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (statusFilter !== 'All' && r.myStatus !== statusFilter) return false
        if ((fromFilter || toFilter) && !r.periodDate) return false
        if (fromFilter && r.periodDate && r.periodDate < fromFilter) return false
        if (toFilter && r.periodDate && r.periodDate > toFilter) return false
        return true
      }),
    [rows, statusFilter, fromFilter, toFilter]
  )

  const filtersActive = statusFilter !== 'All' || fromFilter !== '' || toFilter !== ''

  const notifications = useMemo(() => {
    const items: { id: string; title: string; body: string; ack?: Acknowledgement }[] = []
    for (const ack of pendingAcks) {
      items.push({
        id: `n-${ack.id}`,
        title: `${ack.type} acknowledgement required`,
        body: `Hi ${selfName}, ${ack.assetLabel} needs your ${ack.type.toLowerCase()} acknowledgement with a condition assessment (raised ${formatDate(ack.raisedOn)}; reminders every ${config.ackRules.reminderEveryDays} days).`,
        ack,
      })
    }
    for (const asset of myAssets) {
      const overdue = daysOverdue(asset, today)
      if (overdue > config.ackRules.overdueAfterDays) {
        items.push({
          id: `n-ov-${asset.id}`,
          title: 'Overdue return',
          body: `${asset.assetTag} · ${asset.name} was expected back by ${formatDate(asset.expectedReturnDate)} and is ${overdue} day(s) overdue. This has been escalated to your Company Admin.`,
        })
      }
    }
    return items
  }, [pendingAcks, myAssets, today, selfName, config.ackRules])

  return (
    <div className='w-full space-y-4'>
      {notifications.length > 0 && (
        <div className='space-y-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Notifications ({notifications.length})
          </h2>
          {notifications.map((n) => (
            <div
              key={n.id}
              className='border-gray-200 flex items-start justify-between gap-3 rounded-[6px] border bg-white p-3'
            >
              <div className='flex items-start gap-2'>
                <BellRinging size={18} className='text-orange-1200 mt-0.5 shrink-0' />
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>{n.title}</p>
                  <p className='text-paragraph-sm text-neutral-1000'>{n.body}</p>
                </div>
              </div>
              {n.ack && (
                <Button className='h-7 shrink-0 rounded-[6px] px-2.5' onClick={() => setAckTarget(n.ack ?? null)}>
                  Complete now
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My asset list ({filteredRows.length}
            {filteredRows.length !== rows.length ? ` of ${rows.length}` : ''})
          </h2>
          <Button
            variant='red'
            onClick={() => setReqFormOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Requisition
          </Button>
        </div>

        <div className='border-gray-200 mb-3 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
          <div className='flex flex-col gap-1'>
            <Label className='text-paragraph-sm'>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='h-7! w-[250px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>All statuses</SelectItem>
                {MY_ASSET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='my-from' className='text-paragraph-sm'>
              Period from
            </Label>
            <Input
              id='my-from'
              type='date'
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className='h-7 w-[145px]'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='my-to' className='text-paragraph-sm'>
              Period to
            </Label>
            <Input
              id='my-to'
              type='date'
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              className='h-7 w-[145px]'
            />
          </div>
          <div className='ms-auto'>
            <Button
              variant='outline'
              className='h-7 rounded-[6px] px-2.5'
              onClick={() => {
                setStatusFilter('All')
                setFromFilter('')
                setToFilter('')
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className='border-gray-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
            <Package size={32} className='text-neutral-1000' />
            <p className='text-neutral-1600 text-paragraph-md font-medium'>
              No assets are allocated to you
            </p>
            <p className='text-paragraph-sm text-neutral-1000'>
              Raise an asset requisition with the New Requisition button above (or from the
              Requests tab) when you need equipment.
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className='border-gray-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
            <Package size={32} className='text-neutral-1000' />
            <p className='text-neutral-1600 text-paragraph-md font-medium'>
              No assets match the applied filters
            </p>
            {filtersActive && (
              <p className='text-paragraph-sm text-neutral-1000'>
                Adjust the status or From/To period, or press Reset to view all your assets.
              </p>
            )}
          </div>
        ) : (
          <div className='border-gray-200 overflow-hidden rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Issued on</TableHead>
                  <TableHead>To be returned on</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Pending action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map(({ asset, myStatus, pending, issuedOn }) => {
                  const overdue = daysOverdue(asset, today)
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='text-neutral-1600 text-sm font-medium'>
                            {asset.assetTag} · {asset.name}
                          </span>
                          <span className='text-paragraph-sm text-neutral-1000'>
                            {asset.serial}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>{asset.category}</TableCell>
                      <TableCell className='text-sm'>{formatDate(issuedOn)}</TableCell>
                      <TableCell>
                        {asset.expectedReturnDate ? (
                          <span
                            className={
                              overdue > 0
                                ? 'text-orange-1200 text-sm font-medium'
                                : 'text-sm'
                            }
                          >
                            {formatDate(asset.expectedReturnDate)}
                          </span>
                        ) : (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            No return due
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={MY_STATUS_VARIANTS[myStatus]}>{myStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5'>
                          <AssetStateBadge state={asset.state} />
                          <OverdueBadge daysOverdue={overdue} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {pending ? (
                          <Button
                            className='h-7 rounded-[6px] px-2.5'
                            onClick={() => setAckTarget(pending)}
                          >
                            Acknowledge {pending.type.toLowerCase()}
                          </Button>
                        ) : (
                          <span className='text-paragraph-sm text-neutral-1000'>None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {completedAcks.length > 0 && (
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md mb-2 font-medium'>
            My acknowledgement records
          </h2>
          <div className='grid gap-2 lg:grid-cols-2'>
            {completedAcks.map((ack) => (
              <div key={ack.id} className='border-gray-200 rounded-[6px] border bg-white p-3'>
                <div className='mb-1 flex items-center gap-1.5'>
                  <span className='text-neutral-1600 text-sm font-medium'>{ack.assetLabel}</span>
                  <Badge variant='open'>{ack.type}</Badge>
                  <AckStatusBadge status={ack.status} />
                </div>
                <p className='text-paragraph-sm text-neutral-1000 mb-1'>
                  Acknowledged {formatDate(ack.completedOn)} · template v{ack.templateVersion} —
                  receipt and return conditions stay visible side by side for comparison.
                </p>
                <ul className='text-paragraph-sm text-neutral-1600 space-y-0.5'>
                  {ack.responses.map((r) => (
                    <li key={r.fieldId}>
                      <span className='text-neutral-1000'>{r.label}:</span> {r.value}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <RequisitionFormOverlay
        open={reqFormOpen}
        onOpenChange={setReqFormOpen}
        categories={config.categories}
        adminMode={false}
        employees={EMPLOYEES.filter((e) => e.company === HOME_COMPANY && e.active)}
        onSubmit={(draft) =>
          reqStore.raiseRequisition(draft, null, config.approverFor('Requisition'))
        }
      />

      <AckDialog
        open={ackTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAckTarget(null)
        }}
        ack={ackTarget}
        questionnaireVersions={config.questionnaireVersions}
        recordedBy={selfName}
        onBehalf={false}
        onSubmit={(ackId, responses) =>
          store.completeAcknowledgement(ackId, responses, selfName, false)
        }
      />
    </div>
  )
}
