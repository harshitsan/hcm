import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type AttendanceRecord } from '../data/attendance'
import { employeeById, employeeName, fmtDate, fmtHours } from '../data/shared'
import { DuplicateBadge, OtBadge, SourceBadge, StatusBadge, ViolationBadge } from './badges'

interface RecordDetailSheetProps {
  record: AttendanceRecord | null
  onOpenChange: (open: boolean) => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-4 py-1.5 text-sm'>
      <span className='text-neutral-1000 shrink-0'>{label}</span>
      <span className='text-neutral-1600 text-right font-medium'>{children}</span>
    </div>
  )
}

/**
 * Record drill-down (TNA-13/19/22): full capture provenance, engine-computed
 * hours and the immutable override history with before/after values.
 */
export function RecordDetailSheet({ record, onOpenChange }: RecordDetailSheetProps) {
  const emp = record ? employeeById(record.employeeId) : null
  return (
    <Sheet open={record !== null} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Attendance Record — {record ? employeeName(record.employeeId) : ''}
          </SheetTitle>
        </SheetHeader>

        {record && (
          <div className='flex-1 overflow-y-auto px-5 py-4'>
            <Row label='Date'>
              {fmtDate(record.date)} ({record.dayType})
            </Row>
            <Row label='Employee'>
              {emp
                ? `${emp.name} · ${emp.code}${emp.selfService ? '' : ' (non-user)'}`
                : 'Unmatched punch'}
            </Row>
            <Row label='Punches'>
              {record.punchIn} → {record.punchOut ?? 'missing'}
            </Row>
            <Row label='Capture source'>
              <span className='inline-flex items-center gap-1.5'>
                <SourceBadge source={record.source} />
                {record.duplicateOfId && <DuplicateBadge />}
              </span>
            </Row>
            <Row label='Origin'>{record.origin}</Row>
            {record.enteredBy && <Row label='Entered by'>{record.enteredBy}</Row>}
            <Row label='Shift'>
              {record.shiftName}
              {record.nightShift ? ' (night)' : ''}
            </Row>
            <Row label='Status'>
              <StatusBadge status={record.status} />
            </Row>

            <Separator className='my-3' />
            <p className='text-neutral-1000 mb-1 text-xs font-medium uppercase'>
              Time engine output (recomputed deterministically from punches)
            </p>
            <Row label='Worked hours'>{fmtHours(record.workedHours)}</Row>
            <Row label='Breaks'>
              {record.breaksCount} · {record.breakMinutes} min
            </Row>
            <Row label='Effective hours'>{fmtHours(record.effectiveHours)}</Row>
            <Row label='Overtime'>
              <span className='inline-flex items-center gap-1.5'>
                {record.overtimeHours > 0 && fmtHours(record.overtimeHours)}
                <OtBadge category={record.overtimeCategory} />
              </span>
            </Row>
            <Row label='Compliance'>
              <ViolationBadge flag={record.complianceFlag} />
            </Row>

            <Separator className='my-3' />
            <p className='text-neutral-1000 mb-2 text-xs font-medium uppercase'>
              Override audit trail ({record.overrides.length}) — immutable
            </p>
            {record.overrides.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No overrides. Any administrative change will record before and
                after values, the mandatory reason, the acting user and a
                timestamp here (bitemporal history — prior states remain
                reconstructable).
              </p>
            ) : (
              <div className='space-y-3'>
                {record.overrides.map((o, i) => (
                  <div
                    key={`${o.at}-${i}`}
                    className='rounded-[6px] border border-gray-200 bg-white p-3 text-sm'
                  >
                    <p className='font-medium'>
                      {o.by} · {o.at}
                    </p>
                    <p className='text-neutral-1000 text-xs'>
                      {o.beforeIn} → {o.beforeOut ?? 'missing'} changed to{' '}
                      {o.afterIn} → {o.afterOut}
                    </p>
                    <p className='pt-1'>Reason: {o.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
