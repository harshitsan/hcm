import { Link } from '@tanstack/react-router'
import { ArrowRight, Globe2, HardDriveDownload, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PLATFORM_HEALTH, trendTo } from '../data/role-dashboards'
import { MiniBars, Sparkline } from './sparkline'

/**
 * Platform health widgets for the Platform Admin landing view (R2):
 * jurisdiction coverage, active users across every tenant, and the data
 * import pipeline — the operational side that billing charts don't show.
 */
export function PlatformHealthPanel() {
  const h = PLATFORM_HEALTH
  const activeUsersTrend = trendTo(h.activeUsers, h.activeUsersTrendDeltas)
  const jobs = h.importJobs

  return (
    <Card className='flex flex-col gap-4 p-4'>
      <div>
        <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
          Platform health
        </h4>
        <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
          Coverage, usage and data imports across every tenant
        </p>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Link
          to='/jurisdictions'
          className='group hover:border-neutral-600 flex flex-col gap-1 rounded-[6px] border border-gray-200 p-3 transition-colors'
        >
          <span className='text-paragraph-sm text-neutral-1000 flex items-center gap-1.5'>
            <Globe2 className='size-3.5' /> Jurisdictions covered
          </span>
          <span className='font-display text-neutral-1600 text-xl font-semibold tabular-nums'>
            {h.jurisdictionsCovered}
          </span>
          <span className='text-green-1300 text-xs font-medium'>
            +{h.jurisdictionsAddedThisQuarter} added this quarter
          </span>
        </Link>

        <Link
          to='/roles-security'
          className='group hover:border-neutral-600 flex flex-col gap-1 rounded-[6px] border border-gray-200 p-3 transition-colors'
        >
          <span className='text-paragraph-sm text-neutral-1000 flex items-center gap-1.5'>
            <UserCheck className='size-3.5' /> Active users (30 days)
          </span>
          <span className='font-display text-neutral-1600 text-xl font-semibold tabular-nums'>
            {h.activeUsers.toLocaleString('en-US')}
          </span>
          <Sparkline
            values={activeUsersTrend}
            width={140}
            height={24}
            className='text-blue-1200'
          />
        </Link>

        <Link
          to='/data-management'
          className='group hover:border-neutral-600 flex flex-col gap-1 rounded-[6px] border border-gray-200 p-3 transition-colors'
        >
          <span className='text-paragraph-sm text-neutral-1000 flex items-center gap-1.5'>
            <HardDriveDownload className='size-3.5' /> Import jobs (7 days)
          </span>
          <span className='font-display text-neutral-1600 text-xl font-semibold tabular-nums'>
            {jobs.completed + jobs.running + jobs.failed}
          </span>
          <span className='text-xs'>
            <span className='text-green-1300 font-medium'>
              {jobs.completed} completed
            </span>
            <span className='text-neutral-1000'> · {jobs.running} running · </span>
            <span className='text-red-1400 font-medium'>
              {jobs.failed} failed
            </span>
          </span>
        </Link>
      </div>

      <div className='flex flex-col gap-2'>
        <span className='text-paragraph-sm text-neutral-1000'>
          Import jobs finished per day
        </span>
        <MiniBars
          values={h.importJobsDaily}
          height={64}
          className='text-blue-1200'
          labels={['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']}
        />
      </div>

      <Link
        to='/data-management'
        className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
      >
        Open data management <ArrowRight className='size-3.5' />
      </Link>
    </Card>
  )
}
