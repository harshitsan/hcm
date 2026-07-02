interface StatItem {
  label: string
  value: string
}

interface SummaryStatsProps {
  stats: StatItem[]
  columns?: '2' | '3' | '4'
}

export function SummaryStats({ stats, columns = '4' }: SummaryStatsProps) {
  const gridCols = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-3 ${gridCols[columns]}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='border-grey-200 rounded-md border bg-white p-4 py-3'
        >
          <h4 className='text-neutral-1600 mb-1 text-2xl font-medium'>
            {stat.value}
          </h4>
          <div className='text-neutral-1800 font-regular text-xs'>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
