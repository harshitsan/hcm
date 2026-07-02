interface MetricItemProps {
  value: string | number
  label: string
  variant: 'success' | 'error' | 'warning' | 'info'
}

const variantStyles = {
  success: {
    container: 'bg-green-1400 border-green-1500',
    text: 'text-green-1300',
  },
  error: {
    container: 'bg-red-1300 border-vanilla-400',
    text: 'text-red-1400',
  },
  warning: {
    container: 'bg-yellow-1400 border-yellow-1500',
    text: 'text-yellow-1300',
  },
  info: {
    container: 'bg-blue-1400 border-blue-1500',
    text: 'text-blue-1300',
  },
}

export function MetricItem({ value, label, variant }: MetricItemProps) {
  const styles = variantStyles[variant]

  return (
    <div className='flex items-center justify-center gap-2'>
      <div
        className={`${styles.container} flex h-8 items-center justify-center rounded-[5px] border-1`}
      >
        <p className={`${styles.text} text-md px-1.75 font-semibold`}>
          {value}
        </p>
      </div>
      <h5 className='text-black-100 text-xs font-medium'>{label}</h5>
    </div>
  )
}
