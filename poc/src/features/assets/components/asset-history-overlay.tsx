import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Asset } from '../data/assets'
import { formatDate, todayIso } from '../data/org'
import { AssetStateBadge } from './badges'

interface AssetHistoryOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

/**
 * Read-only, append-only asset history (ASM-02, ASM-17): every entry keeps
 * the prior/new state, actor, affected employee, effective (business) date
 * and the system-recorded timestamp, plus the rules-engine decision that
 * allowed it (ASM-23). The as-of query reconstructs state and holder on any
 * past date.
 */
export function AssetHistoryOverlay({ open, onOpenChange, asset }: AssetHistoryOverlayProps) {
  const [asOf, setAsOf] = useState(todayIso())

  const asOfSnapshot = useMemo(() => {
    if (!asset) return null
    const entries = asset.history.filter((e) => e.effectiveDate <= asOf)
    if (entries.length === 0) return { state: 'Not yet registered', holder: '—' }
    const last = entries[entries.length - 1]
    const lastHolderEvent = [...entries]
      .reverse()
      .find((e) => e.employee !== null || e.newState === 'Available' || e.newState === 'Returned')
    return {
      state: last.newState,
      holder:
        lastHolderEvent && lastHolderEvent.employee && (lastHolderEvent.newState === 'Issued' || lastHolderEvent.newState === 'Loan' || lastHolderEvent.newState === 'Allocated')
          ? lastHolderEvent.employee
          : '—',
    }
  }, [asset, asOf])

  if (!asset) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            History — {asset.assetTag} · {asset.name}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='border-grey-200 rounded-[6px] border bg-white p-3'>
            <div className='mb-2 flex items-end gap-3'>
              <div className='flex flex-col gap-1'>
                <Label htmlFor='asof-date' className='text-paragraph-sm'>
                  Query status as of
                </Label>
                <Input
                  id='asof-date'
                  type='date'
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  className='h-7 w-[160px]'
                />
              </div>
              <div className='text-paragraph-sm text-neutral-1600 pb-1'>
                State: <span className='font-medium'>{asOfSnapshot?.state}</span> · Holder:{' '}
                <span className='font-medium'>{asOfSnapshot?.holder}</span>
              </div>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              History is append-only and read-only — corrections are stored as new
              versions without overwriting prior records.
            </p>
          </div>

          <div className='space-y-2'>
            {[...asset.history].reverse().map((entry) => (
              <div key={entry.id} className='border-grey-200 rounded-[6px] border bg-white p-3'>
                <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                  <span className='text-neutral-1600 text-sm font-medium'>{entry.event}</span>
                  {entry.priorState && <AssetStateBadge state={entry.priorState} />}
                  {entry.priorState && <span className='text-neutral-1000 text-xs'>→</span>}
                  <AssetStateBadge state={entry.newState} />
                  {entry.ruleId && <Badge variant='open'>rule {entry.ruleId}</Badge>}
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Actor: {entry.actor}
                  {entry.employee ? ` · Employee: ${entry.employee}` : ''} · Effective{' '}
                  {formatDate(entry.effectiveDate)} · Recorded{' '}
                  {new Date(entry.recordedAt).toLocaleString('en-GB')}
                </p>
                {entry.note && (
                  <p className='text-paragraph-sm text-neutral-1600 mt-1'>{entry.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
