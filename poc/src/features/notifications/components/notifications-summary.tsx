import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type AppNotification, type DeliveryRecord } from '../data/notifications'

interface NotificationsSummaryProps {
  notifications: AppNotification[]
  deliveries: DeliveryRecord[]
}

/** Count cards shown above the tabs (unread, approvals, delivered, dead-letter). */
export function NotificationsSummary({
  notifications,
  deliveries,
}: NotificationsSummaryProps) {
  const summaryItems = useMemo(() => {
    const unread = notifications.filter((n) => !n.read).length
    const approvals = notifications.filter(
      (n) => !n.read && (n.category === 'approval' || n.category === 'escalation')
    ).length
    const delivered = deliveries.filter(
      (d) =>
        d.finalStatus === 'delivered' || d.finalStatus === 'sent via fallback'
    ).length
    const attention = deliveries.filter(
      (d) => d.finalStatus === 'dead-letter' || d.finalStatus === 'failed'
    ).length

    return [
      { label: 'Unread notifications', value: unread },
      { label: 'Approvals & escalations', value: approvals },
      { label: 'Deliveries succeeded', value: delivered },
      { label: 'Dead-letter / failed', value: attention },
    ]
  }, [notifications, deliveries])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Communications Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
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
