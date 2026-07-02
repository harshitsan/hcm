export interface MetricItem {
  label: string
  value: string | number
  color: string
}

export interface MetricsBreakdownProps {
  topMetrics: {
    left: {
      label: string
      value: string | number
    }
    right: {
      label: string
      value: string | number
    }
  }
  breakdownItems: MetricItem[]
  className?: string
}

export function MetricsBreakdown({
  topMetrics,
  breakdownItems,
  className = '',
}: MetricsBreakdownProps) {
  return (
    <div className={`${className}`}>
      {/* Top metrics */}
      <div className='border-grey-1500 mx-3 mb-2 flex items-center justify-between gap-6 border-b-1 pb-2'>
        <div className='flex w-1/2 flex-col'>
          <p className='text-grey-1200 m-0 text-xs font-[400]'>
            {topMetrics.left.label}
          </p>
          <h3 className='text-black-100 m-0 text-2xl font-medium'>
            {topMetrics.left.value}
          </h3>
        </div>
        <div className='flex w-1/2 flex-col'>
          <p className='text-grey-1200 m-0 text-xs font-[400]'>
            {topMetrics.right.label}
          </p>
          <h3 className='text-black-100 m-0 text-2xl font-medium'>
            {topMetrics.right.value}
          </h3>
        </div>
      </div>

      {/* Breakdown items */}
      <div className='mx-3 mb-2 flex items-center justify-between gap-4 py-3'>
        {breakdownItems.map((item, index) => (
          <div key={index} className=''>
            <div className='flex items-stretch gap-2'>
              <div className={`h-[36px] w-[3px] ${item.color}`}></div>
              <div>
                <p className='text-grey-1200 m-0 text-xs font-[400]'>
                  {item.label}
                </p>
                <h3 className='text-black-100 m-0 text-xl font-medium'>
                  {item.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
