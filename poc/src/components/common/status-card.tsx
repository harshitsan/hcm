interface StatusCardProps {
  value: number
  label: string
  borderColor: string
  backgroundColor: string
  textColor: string
  className?: string
}

export function StatusCard({
  value,
  label,
  borderColor,
  backgroundColor,
  textColor,
  className = '',
}: StatusCardProps) {
  return (
    <div
      className={`border-orange-1300 w-full rounded-[4px] border-[1px] shadow-none ${className}`}
      style={{
        borderColor,
        backgroundColor,
        color: textColor,
      }}
    >
      <div className='px-2.5 py-2'>
        <div className='flex items-center gap-2'>
          <div
            title={value.toString()}
            className='text-orange-1400 text-[28px] font-medium'
          >
            {value.toString().length > 2
              ? '99+'
              : new Intl.NumberFormat('en', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)}
          </div>
          <div className='text-orange-1400 text-xs font-normal'>{label}</div>
        </div>
      </div>
    </div>
  )
}
