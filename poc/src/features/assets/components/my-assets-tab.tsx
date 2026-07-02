import { useMemo, useState } from 'react'
import { BellRinging, Package } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Acknowledgement } from '../data/acknowledgements'
import { SELF_EMPLOYEE_ID, employeeName, formatDate, todayIso } from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { daysOverdue } from './asset-columns'
import { AckDialog } from './ack-dialog'
import { AckStatusBadge, AssetStateBadge, OverdueBadge } from './badges'

interface MyAssetsTabProps {
  store: AssetsStore
  config: AssetConfigStore
}

/**
 * Employee self-service (ASM-15): my allocated assets with acknowledgement
 * flags and overdue indicators, templated notifications (ASM-22), pending
 * receipt/return acknowledgements completed via the dynamic condition form
 * (ASM-07/08/24), and receipt-vs-return condition comparison.
 */
export function MyAssetsTab({ store, config }: MyAssetsTabProps) {
  const [ackTarget, setAckTarget] = useState<Acknowledgement | null>(null)
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
              className='border-grey-200 flex items-start justify-between gap-3 rounded-[6px] border bg-white p-3'
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
        <h2 className='text-neutral-1600 text-paragraph-md mb-2 font-medium'>
          My allocated assets ({myAssets.length})
        </h2>
        {myAssets.length === 0 ? (
          <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
            <Package size={32} className='text-neutral-1000' />
            <p className='text-neutral-1600 text-paragraph-md font-medium'>
              No assets are allocated to you
            </p>
            <p className='text-paragraph-sm text-neutral-1000'>
              Raise an asset requisition from the Requisitions tab when you need equipment.
            </p>
          </div>
        ) : (
          <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Issued on</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Pending action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssets.map((asset) => {
                  const pending = pendingAcks.find((k) => k.assetId === asset.id)
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
                      <TableCell className='text-sm'>{formatDate(asset.issueDate)}</TableCell>
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
              <div key={ack.id} className='border-grey-200 rounded-[6px] border bg-white p-3'>
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
