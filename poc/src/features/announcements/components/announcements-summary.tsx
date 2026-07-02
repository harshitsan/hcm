import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Announcement } from '../data/announcements'

interface AnnouncementsSummaryProps {
  announcements: Announcement[]
}

/** Count cards above the management list — lifecycle at a glance (ANN-29/36). */
export function AnnouncementsSummary({ announcements }: AnnouncementsSummaryProps) {
  const summaryItems = useMemo(() => {
    const by = (...statuses: Announcement['status'][]) =>
      announcements.filter((a) => statuses.includes(a.status)).length

    return [
      { label: 'Total announcements', value: announcements.length },
      { label: 'Live (Published)', value: by('Published') },
      { label: 'Pending approval', value: by('Pending approval') },
      { label: 'Scheduled', value: by('Scheduled') },
      { label: 'Completed', value: by('Recently Completed', 'Completed') },
    ]
  }, [announcements])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Announcements Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex w-full items-center gap-3'>
                <div className='flex flex-col gap-4'>
                  <span className='text-paragraph-sm font-medium text-black'>
                    {item.label}
                  </span>
                  <span className='text-3xl font-medium text-black'>
                    {item.value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
