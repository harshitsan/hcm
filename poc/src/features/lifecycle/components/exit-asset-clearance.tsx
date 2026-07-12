/**
 * W8 — live asset-clearance panel inside the exit workspace. Reads the
 * Assets module's exit-clearance bridge and re-renders whenever any asset
 * changes hands, so returning a laptop in Assets → Exit clearance releases
 * the exit here without a refresh.
 */
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  exitAssetClearance,
  subscribeAssetClearance,
  type ExitAssetClearance,
} from '../data/asset-clearance'
import { fmtDate } from '../data/shared'

/** Live clearance verdict for one employee (updates with the asset store). */
export function useExitAssetClearance(employeeName: string): ExitAssetClearance {
  const [, setVersion] = useState(0)
  useEffect(
    () => subscribeAssetClearance(() => setVersion((v) => v + 1)),
    []
  )
  return exitAssetClearance(employeeName)
}

interface AssetClearancePanelProps {
  employeeName: string
  clearance: ExitAssetClearance
}

/**
 * "Asset clearance" card — blocked (with the unreturned list), cleared, or
 * "No tracked assets" when the employee has no asset-register record.
 */
export function AssetClearancePanel({
  employeeName,
  clearance,
}: AssetClearancePanelProps) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2'>
        <span className='text-neutral-1600 text-sm font-semibold'>
          Asset clearance
        </span>
        {!clearance.tracked ? (
          <Badge variant='badge_inactive'>No tracked assets</Badge>
        ) : clearance.cleared ? (
          <Badge variant='completed'>Assets cleared</Badge>
        ) : (
          <Badge variant='overdue'>
            Clearance blocked — {clearance.unreturned.length} asset(s)
            unreturned
          </Badge>
        )}
      </div>

      <div className='space-y-2 px-3 py-2.5'>
        {!clearance.tracked && (
          <p className='text-neutral-1000 text-xs'>
            {employeeName} has no record in the asset register, so no company
            assets are tracked against this exit.
          </p>
        )}

        {clearance.tracked && !clearance.cleared && (
          <>
            <p className='text-xs text-red-700'>
              The following assets are still with {employeeName}. The exit
              cannot be finalized until every asset is returned or written
              off.
            </p>
            <ul className='space-y-1'>
              {clearance.unreturned.map((a) => (
                <li
                  key={a.id}
                  className='flex items-center justify-between gap-2 rounded-[6px] border border-red-200 bg-red-50 px-2 py-1.5 text-xs'
                >
                  <span className='min-w-0'>
                    <span className='text-neutral-1600 font-medium'>
                      {a.name}
                    </span>{' '}
                    <span className='text-neutral-1000'>
                      · {a.assetTag} · {a.category}
                    </span>
                  </span>
                  <Badge variant='outline' className='shrink-0 text-[10px]'>
                    {a.state}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className='text-neutral-1000 text-xs'>
              Recovery actions (record a return or write-off) are handled in
              the Assets module → Exit clearance screen. This panel updates
              automatically once the assets are recovered.
            </p>
          </>
        )}

        {clearance.tracked && clearance.cleared && (
          <p className='text-neutral-1000 text-xs'>
            No company assets remain with {employeeName}.
          </p>
        )}

        {clearance.tracked && clearance.returned.length > 0 && (
          <div>
            <p className='text-neutral-1000 mb-1 text-[11px] font-medium uppercase'>
              Already returned
            </p>
            <ul className='space-y-1'>
              {clearance.returned.map((r) => (
                <li
                  key={r.asset.id}
                  className='text-neutral-1000 flex items-center justify-between gap-2 text-xs'
                >
                  <span className='min-w-0'>
                    <span className='text-neutral-1600'>{r.asset.name}</span> ·{' '}
                    {r.asset.assetTag}
                  </span>
                  <span className='shrink-0'>
                    returned {fmtDate(r.returnedOn)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
