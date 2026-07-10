/** Shared white-card shell + legend dot for the Platform Admin dashboard. */

export function PlatformPanel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex flex-col rounded-[8px] border border-gray-200 bg-white p-4 ${className}`}
    >
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h3 className='text-paragraph-md text-neutral-1600 font-semibold'>
            {title}
          </h3>
          {subtitle && (
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className='mt-3 flex-1'>{children}</div>
    </section>
  )
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className='text-paragraph-sm text-neutral-1100 inline-flex items-center gap-1.5'>
      <span
        aria-hidden='true'
        className='size-2 shrink-0 rounded-full'
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
