interface DonutChartLabelProps {
  readonly interactedLeads: number
  readonly activeLeads: number
  readonly className?: string
}

export function DonutChartLabel({
  interactedLeads,
  activeLeads,
  className = '',
}: DonutChartLabelProps) {
  return (
    <div
      className={`pointer-events-none absolute top-20 right-12 hidden w-[305px] md:block ${className}`}
    >
      <div className='mb-2 flex items-center gap-12'>
        <div className='flex items-center gap-2'>
          <p className='text-grey-1200 text-sm'>Interacted Leads</p>
          <p className='text-sm font-semibold'>{interactedLeads}</p>
        </div>

        <div className='flex items-center gap-2'>
          <p className='text-grey-1200 text-sm'>Active Leads</p>
          <p className='text-sm font-semibold'>{activeLeads}</p>
        </div>
      </div>
      <div className='bg-grey-200 mb-2 h-[1px]'></div>
    </div>
  )
}
