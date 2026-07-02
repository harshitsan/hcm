import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type RetentionPolicyVersion } from '../data/audit-config'
import { type AuditEntry, type SecurityEvent } from '../data/audit-entries'

interface AuditSummaryProps {
  entries: AuditEntry[]
  securityEvents: SecurityEvent[]
  policy: RetentionPolicyVersion
}

/** Count cards shown above the tabs (scoped to the active role). */
export function AuditSummary({
  entries,
  securityEvents,
  policy,
}: AuditSummaryProps) {
  const summaryItems = useMemo(() => {
    const byTier = (tier: AuditEntry['storageTier']) =>
      entries.filter((e) => e.storageTier === tier).length

    return [
      { label: 'Audit entries in scope', value: `${entries.length}` },
      { label: `Active store (${policy.activeMonths} mo window)`, value: `${byTier('active')}` },
      { label: `Archived (${policy.totalYears} yr total)`, value: `${byTier('archived')}` },
      { label: 'Security events', value: `${securityEvents.length}` },
    ]
  }, [entries, securityEvents, policy])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Audit Summary
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
                    {item.value}
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
