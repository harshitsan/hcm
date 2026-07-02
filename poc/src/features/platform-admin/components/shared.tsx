import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Summary count cards shown above the module, mirroring the users module. */
export function SummaryCards({
  title,
  items,
}: {
  title: string
  items: { label: string; value: number | string }[]
}) {
  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {items.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex flex-col gap-3'>
                <span className='text-paragraph-sm font-medium text-black'>
                  {item.label}
                </span>
                <span className='text-2xl font-medium text-black'>
                  {typeof item.value === 'number'
                    ? item.value.toLocaleString('en-US')
                    : item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** White card section used inside tabs — title, optional actions, content. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={`border-grey-200 mb-4 w-full gap-3 rounded-[6px] bg-white py-4 ${className ?? ''}`}
    >
      <CardHeader className='flex items-start justify-between gap-2 px-4 pb-0'>
        <div className='flex flex-col gap-0.5'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            {title}
          </CardTitle>
          {description && (
            <p className='text-paragraph-sm text-neutral-1000'>{description}</p>
          )}
        </div>
        {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
      </CardHeader>
      <CardContent className='px-4'>{children}</CardContent>
    </Card>
  )
}

export type BadgeTone = 'green' | 'blue' | 'red' | 'amber' | 'grey'

const toneVariant: Record<
  BadgeTone,
  'badge_active' | 'open' | 'dropped' | 'overdue' | 'badge_inactive'
> = {
  green: 'badge_active',
  blue: 'open',
  red: 'dropped',
  amber: 'overdue',
  grey: 'badge_inactive',
}

/** Small status badge with a semantic color tone. */
export function ToneBadge({
  tone,
  children,
}: {
  tone: BadgeTone
  children: React.ReactNode
}) {
  return <Badge variant={toneVariant[tone]}>{children}</Badge>
}

/** Lightweight inline table for card content (headers + rows). */
export function MiniTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <div className='border-grey-200 overflow-x-auto rounded-[6px] border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-grey-200 bg-neutral-200 border-b'>
            {headers.map((h) => (
              <th
                key={h}
                className='text-paragraph-sm text-neutral-1000 px-3 py-2 text-left font-medium whitespace-nowrap'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={headers.length}
                className='text-neutral-1000 px-3 py-4 text-center'
              >
                No records
              </td>
            </tr>
          )}
          {rows.map((cells, i) => (
            <tr key={i} className='border-grey-200 border-b last:border-b-0'>
              {cells.map((cell, j) => (
                <td key={j} className='text-neutral-1900 px-3 py-2 align-middle'>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
