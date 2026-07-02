import { useMemo, useState } from 'react'
import { LockSimple, Play } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { type Company, type ReportDef } from '../data/report-catalog'
import { SELF_EMPLOYEE } from '../data/report-rows'
import { RunReportSheet } from './run-report-sheet'

interface MyReportsTabProps {
  reports: ReportDef[]
  companies: Company[]
}

/**
 * Employee self-service reports (RPT-15): only reports flagged for
 * self-service, always scoped to the signed-in employee's own records, with
 * personal export. Wider scopes are denied.
 */
export function MyReportsTab({ reports, companies }: MyReportsTabProps) {
  const [running, setRunning] = useState<ReportDef | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const selfReports = useMemo(
    () => reports.filter((r) => r.enabled && r.selfService),
    [reports]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          My Reports ({selfReports.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            every run returns {SELF_EMPLOYEE}'s records only
          </span>
        </h2>
        <Button
          variant='outline'
          className='h-7 gap-1'
          onClick={() =>
            toast.error(
              'Access denied — company-wide and other employees’ data is outside your scope'
            )
          }
        >
          <LockSimple size={14} weight='bold' />
          Try company-wide data
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        {selfReports.map((report) => (
          <div
            key={report.id}
            className='flex items-center justify-between gap-3 rounded-[8px] border border-gray-200 bg-white px-4 py-3'
          >
            <div className='min-w-0'>
              <p className='text-neutral-1600 truncate text-sm font-medium'>
                {report.name}
              </p>
              <p className='text-neutral-1000 truncate text-xs'>
                {report.description}
              </p>
            </div>
            <Button
              variant='outline'
              className='h-7 shrink-0 gap-1'
              onClick={() => {
                setRunning(report)
                setSheetOpen(true)
              }}
            >
              <Play size={12} weight='fill' />
              Run
            </Button>
          </div>
        ))}
      </div>

      <RunReportSheet
        report={running}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setRunning(null)
        }}
        companies={companies}
        selfOnly
      />
    </div>
  )
}
