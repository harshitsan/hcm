import { useState } from 'react'
import { useRole } from '@/context/role-context'
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
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  assetClearanceFor,
  returnedAssetsFor,
  seedExitCases,
  type AssetSummary,
  type ExitClearanceCase,
} from '../data/exit-clearance'
import { employeeById, formatDate, formatInr, todayIso } from '../data/org'
import { LOST_ROUTING_NOTE, type AssetsStore } from '../hooks/use-assets'
import { AssetStateBadge } from './badges'

interface ExitClearanceSectionProps {
  store: AssetsStore
}

type PendingAction = {
  kind: 'return' | 'lost'
  exitCase: ExitClearanceCase
  asset: AssetSummary
}

/**
 * Exit clearance (W8): employees leaving the company with per-asset return
 * status. Unreturned assets block the clearance verdict until every item is
 * recovered; a lost item is flagged and routed to disciplinary review /
 * recovery. The same verdict is exposed to the lifecycle module through
 * `assetClearanceFor` in data/exit-clearance.ts.
 */
export function ExitClearanceSection({ store }: ExitClearanceSectionProps) {
  const { hasRole } = useRole()
  const [pending, setPending] = useState<PendingAction | null>(null)

  // Admin-only surface; the parent tab is already Company Admin gated, this
  // is a safety net for reuse elsewhere.
  if (!hasRole('Company Admin')) return null

  const today = todayIso()

  const confirmAction = () => {
    if (!pending) return
    if (pending.kind === 'return') {
      store.runTransaction(pending.asset.id, 'recover', {
        effectiveDate: today,
        note: `Recovered during exit clearance for ${pending.exitCase.employeeName}`,
        origin: 'Exit recovery (W8)',
      })
    } else {
      store.runTransaction(pending.asset.id, 'mark-lost', {
        effectiveDate: today,
        note: `Reported lost during exit clearance for ${pending.exitCase.employeeName}`,
      })
    }
    setPending(null)
  }

  return (
    <div className='w-full space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Every asset still with a leaving employee holds their exit clearance.
        Mark each item returned as it is handed back — the verdict updates the
        moment the last one comes in. Lost items are routed to disciplinary
        review / recovery and keep the clearance blocked.
      </p>

      {seedExitCases.map((exitCase) => {
        const clearance = assetClearanceFor(exitCase.employeeId)
        const returned = returnedAssetsFor(exitCase.employeeId)
        const employee = employeeById(exitCase.employeeId)

        return (
          <div
            key={exitCase.employeeId}
            className='border-gray-200 overflow-hidden rounded-[6px] border bg-white'
          >
            <div className='border-gray-200 flex flex-wrap items-center gap-3 border-b px-4 py-3'>
              <div className='flex min-w-0 flex-col'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {exitCase.employeeName}
                  {employee ? ` · ${employee.code}` : ''}
                </span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {exitCase.department} · {exitCase.designation} · Last working day{' '}
                  {formatDate(exitCase.lastWorkingDay)} · {exitCase.source}
                </span>
              </div>
              <div className='ms-auto'>
                {clearance.cleared ? (
                  <Badge variant='completed'>Assets cleared</Badge>
                ) : (
                  <Badge variant='dropped'>
                    Clearance blocked — {clearance.unreturned.length} asset
                    {clearance.unreturned.length === 1 ? '' : 's'} unreturned
                  </Badge>
                )}
              </div>
            </div>

            {clearance.unreturned.length === 0 && returned.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000 px-4 py-4'>
                No assets were issued to this employee — nothing to recover.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Return status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearance.unreturned.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className='text-sm font-medium'>
                        {asset.assetTag} · {asset.name}
                      </TableCell>
                      <TableCell className='text-sm'>{asset.category}</TableCell>
                      <TableCell className='text-sm'>{formatInr(asset.value)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5'>
                          <AssetStateBadge state={asset.state} />
                          <span className='text-paragraph-sm text-red-1400'>
                            {asset.state === 'Lost'
                              ? 'With disciplinary review / recovery'
                              : `Unreturned${asset.issueDate ? ` — held since ${formatDate(asset.issueDate)}` : ''}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.state === 'Lost' ? (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            Awaiting recovery outcome
                          </span>
                        ) : (
                          <div className='flex gap-1.5'>
                            <Button
                              className='h-7 rounded-[6px] px-2.5'
                              onClick={() =>
                                setPending({ kind: 'return', exitCase, asset })
                              }
                            >
                              Mark returned
                            </Button>
                            <Button
                              variant='outline'
                              className='h-7 rounded-[6px] px-2.5'
                              onClick={() => setPending({ kind: 'lost', exitCase, asset })}
                            >
                              Report lost
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {returned.map(({ asset, returnedOn }) => (
                    <TableRow key={asset.id}>
                      <TableCell className='text-sm font-medium'>
                        {asset.assetTag} · {asset.name}
                      </TableCell>
                      <TableCell className='text-sm'>{asset.category}</TableCell>
                      <TableCell className='text-sm'>{formatInr(asset.value)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5'>
                          <Badge variant='completed'>Returned</Badge>
                          <span className='text-paragraph-sm text-neutral-1000'>
                            on {formatDate(returnedOn)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='text-paragraph-sm text-neutral-1000'>Done</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )
      })}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={
          pending?.kind === 'lost'
            ? `Report ${pending.asset.assetTag} as lost?`
            : `Mark ${pending?.asset.assetTag ?? ''} as returned?`
        }
        desc={
          pending?.kind === 'lost'
            ? `${pending.asset.assetTag} · ${pending.asset.name} will be flagged Lost against ${pending.exitCase.employeeName} and ${LOST_ROUTING_NOTE.toLowerCase()}. Their exit clearance stays blocked until the recovery outcome is recorded.`
            : pending
              ? `${pending.asset.assetTag} · ${pending.asset.name} will be recorded as recovered from ${pending.exitCase.employeeName} (tagged "Exit recovery (W8)"). If this is their last outstanding asset, the clearance verdict flips to "Assets cleared".`
              : ''
        }
        confirmText={pending?.kind === 'lost' ? 'Report lost' : 'Mark returned'}
        destructive={pending?.kind === 'lost'}
        handleConfirm={confirmAction}
      />
    </div>
  )
}
