// import { HelpButton } from '@/components/common/help-button'

interface BookingChartLabelProps {
  selected: 'Recieved' | 'Active' | 'Cancellations'
  className?: string
  // Recieved mode
  bookingsCount?: number
  leadsCount?: number
  conversionRatePct?: number
  // Active mode
  activeCount?: number
  // Cancellations mode
  cancellationsCount?: number
}

export function BookingChartLabel({
  selected,
  className = '',
  bookingsCount = 0,
  leadsCount = 0,
  conversionRatePct = 0,
  activeCount = 0,
  cancellationsCount = 0,
}: BookingChartLabelProps) {
  if (selected === 'Active' || selected === 'Cancellations') {
    return (
      <div
        className={`pointer-events-none absolute top-12 right-12 z-10 hidden bg-white px-2 py-1 md:block ${className}`}
      >
        <div className='text-center'>
          <div className='flex items-baseline gap-1'>
            <p className='text-sm leading-6 font-semibold'>
              {selected === 'Active' ? activeCount : cancellationsCount}
            </p>
          </div>
          <p className='text-grey-1200 text-xs'>
            {selected === 'Active' ? 'Active' : 'Cancellations'}
          </p>
        </div>
      </div>
    )
  }

  // Recieved and default: show Bookings/Leads and Conversion Rate
  return (
    <div
      className={`pointer-events-none absolute top-12 right-10 z-10 hidden bg-white px-2 py-1 md:block ${className}`}
    >
      <div className='mb-1 flex items-center justify-between gap-4'>
        <div className='text-center'>
          <div className='flex items-baseline gap-1'>
            <p className='text-xs leading-6 font-semibold'>{bookingsCount}</p>
            <p className='text-grey-1200 text-xs'>/{leadsCount}</p>
          </div>
          <p className='text-grey-1200 flex items-center justify-center gap-1 text-xs'>
            Bookings / Leads
            {/* <HelpButton
              iconClassName='!w-3 !h-3 fill-neutral-2200'
              tooltipContent={
                <p className='text-xs font-medium'>
                  Bookings compared to total leads
                </p>
              }
            /> */}
          </p>
        </div>

        <div className='text-center'>
          <div className='flex items-baseline gap-1'>
            <p className='text-sm leading-6 font-semibold'>
              {conversionRatePct}
            </p>
          </div>
          <p className='text-grey-1200 text-xs'>Conversion Rate</p>
        </div>
      </div>
    </div>
  )
}
