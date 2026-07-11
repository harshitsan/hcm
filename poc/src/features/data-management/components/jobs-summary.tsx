import { useMemo } from 'react'
import { type DataJob } from '../data/jobs'
import { SummaryCards } from '@/components/module-page'

interface JobsSummaryProps {
  jobs: DataJob[]
}

/** Count cards shown above the job dashboard (live status breakdown). */
export function JobsSummary({ jobs }: JobsSummaryProps) {
  const summaryItems = useMemo(() => {
    const inFlight = jobs.filter((j) =>
      ['Submitted', 'Validating', 'In-progress'].includes(j.status)
    ).length
    const completed = jobs.filter((j) => j.status === 'Completed').length
    const attention = jobs.filter(
      (j) => j.status === 'Failed' || j.status === 'Partially completed'
    ).length
    const failedRecords = jobs.reduce((sum, j) => sum + j.failedRecords, 0)

    return [
      { label: 'Total jobs', value: jobs.length },
      { label: 'In flight', value: inFlight },
      { label: 'Completed', value: completed },
      { label: 'Failed / Partial', value: attention },
      { label: 'Failed records', value: failedRecords },
    ]
  }, [jobs])

  return <SummaryCards title='Import / Export Summary' items={summaryItems} />
}
