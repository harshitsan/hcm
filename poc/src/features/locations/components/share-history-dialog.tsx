import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LocationShare } from '../data/locations'
import type { DateFormat } from '../data/organization'
import type { LocationsStore } from '../hooks/use-locations'
import { formatDate } from '../utils/format'

interface ShareHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  share: LocationShare | null
  store: LocationsStore
  dateFormat: DateFormat
}

const actionBadge = {
  enabled: 'badge_active',
  updated: 'open',
  revoked: 'dropped',
} as const

/**
 * Versioned, effective-dated history of one sharing configuration — prior
 * versions stay retrievable and each version ties to its audit entry
 * (LOC-06 / LOC-12 / LOC-13).
 */
export function ShareHistoryDialog({
  open,
  onOpenChange,
  share,
  store,
  dateFormat,
}: ShareHistoryDialogProps) {
  const location = share ? store.locationById.get(share.locationId) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Version history — {location?.name ?? 'share'}</DialogTitle>
          <DialogDescription>
            Every change creates a new effective-dated version instead of
            overwriting the prior state, so history is reconstructable at any
            point in time.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[380px] space-y-3 overflow-y-auto'>
          {[...(share?.history ?? [])].reverse().map((version) => (
            <div
              key={version.version}
              className='rounded-[6px] border border-gray-200 bg-white p-3'
            >
              <div className='mb-1 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 text-sm font-semibold'>
                    v{version.version}
                  </span>
                  <Badge variant={actionBadge[version.action]}>
                    {version.action}
                  </Badge>
                </div>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Effective {formatDate(version.effectiveFrom, dateFormat)}
                </span>
              </div>
              <p className='text-neutral-1900 text-sm'>{version.summary}</p>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                {version.targetCompanyIds.length > 0
                  ? `Visible to: ${version.targetCompanyIds
                      .map(store.companyName)
                      .join(', ')} · `
                  : ''}
                {version.changedBy} on {formatDate(version.changedOn, dateFormat)}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
