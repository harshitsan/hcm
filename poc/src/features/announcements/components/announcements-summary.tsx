import { useMemo } from 'react'
import { type Announcement } from '../data/announcements'
import { SummaryCards } from '@/components/module-page'

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

  return <SummaryCards title='Announcements Summary' items={summaryItems} />
}
