import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface SummaryItem {
  label: string
  value: number
}

/** Count cards above the entry tables (status breakdown per FBG-04/19). */
export function FeedbackSummary({
  title,
  items,
}: {
  title: string
  items: SummaryItem[]
}) {
  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {items.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex flex-col gap-4'>
                <span className='text-paragraph-sm font-medium text-black'>
                  {item.label}
                </span>
                <span className='text-3xl font-medium text-black'>
                  {item.value.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
