import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export { SummaryCards } from '@/components/module-page/summary-cards'

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
      className={`border-gray-200 mb-4 w-full gap-3 rounded-[6px] bg-white py-4 ${className ?? ''}`}
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
    <div className='border-gray-200 overflow-x-auto rounded-[6px] border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-gray-200 bg-neutral-200 border-b'>
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
            <tr key={i} className='border-gray-200 border-b last:border-b-0'>
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
