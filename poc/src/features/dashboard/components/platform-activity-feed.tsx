import {
  ArrowUpCircle,
  Building2,
  CircleDollarSign,
  FileText,
  PauseCircle,
  ToggleRight,
  UserPlus,
} from 'lucide-react'
import {
  platformActivity,
  type PlatformActivityKind,
} from '../data/platform-metrics'
import { PlatformPanel } from './platform-panel'

const KIND_STYLE: Record<
  PlatformActivityKind,
  { icon: typeof FileText; className: string }
> = {
  'invoice-paid': {
    icon: CircleDollarSign,
    className: 'bg-green-1200 text-green-1300',
  },
  'invoice-issued': { icon: FileText, className: 'bg-blue-100 text-blue-800' },
  'tenant-onboarding': {
    icon: Building2,
    className: 'bg-blue-100 text-blue-800',
  },
  'tenant-suspended': {
    icon: PauseCircle,
    className: 'bg-red-100 text-red-1000',
  },
  'plan-upgraded': {
    icon: ArrowUpCircle,
    className: 'bg-green-1200 text-green-1300',
  },
  'module-enabled': {
    icon: ToggleRight,
    className: 'bg-blue-100 text-blue-800',
  },
  'seats-added': { icon: UserPlus, className: 'bg-blue-100 text-blue-800' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Recent platform-level events: onboarding, billing, plan changes. */
export function PlatformActivityFeed() {
  return (
    <PlatformPanel
      title='Recent platform activity'
      subtitle='Tenant, plan and billing events across the platform'
    >
      <ol className='flex list-none flex-col'>
        {platformActivity.map((a) => {
          const { icon: Icon, className } = KIND_STYLE[a.kind]
          return (
            <li
              key={a.id}
              className='flex gap-3 border-b border-gray-100 py-2.5 last:border-0'
            >
              <span
                aria-hidden='true'
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${className}`}
              >
                <Icon className='size-4' />
              </span>
              <div className='min-w-0 flex-1'>
                <div className='flex items-baseline justify-between gap-2'>
                  <p className='text-paragraph-sm text-neutral-1600 truncate font-medium'>
                    {a.title}
                  </p>
                  <time
                    dateTime={a.at}
                    className='text-neutral-1000 shrink-0 text-xs tabular-nums'
                  >
                    {dateFmt.format(new Date(`${a.at}T00:00:00`))}
                  </time>
                </div>
                <p className='text-paragraph-sm text-neutral-1100 mt-0.5'>
                  {a.detail}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </PlatformPanel>
  )
}
