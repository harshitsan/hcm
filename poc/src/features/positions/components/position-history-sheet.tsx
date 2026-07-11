import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AssignmentHistoryEntry, Employee } from '../data/employees'
import type { Position, PositionHistoryEntry } from '../data/positions'

interface PositionHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position | null
  definitionHistory: PositionHistoryEntry[]
  assignmentHistory: AssignmentHistoryEntry[]
  employees: Employee[]
}

function Period({
  from,
  to,
}: {
  from: string
  to: string | null
}) {
  return (
    <span className='text-neutral-1900 text-sm whitespace-nowrap'>
      {from} → {to ?? 'present'}
    </span>
  )
}

/**
 * Bitemporal history viewer for a position (POS-12/15): every definition
 * change and employee assignment keeps its effective (valid-time) period plus
 * the transaction time it was recorded at — nothing is overwritten.
 */
export function PositionHistorySheet({
  open,
  onOpenChange,
  position,
  definitionHistory,
  assignmentHistory,
  employees,
}: PositionHistorySheetProps) {
  const defRows = position
    ? definitionHistory.filter((h) => h.positionId === position.id)
    : []
  const assignRows = position
    ? assignmentHistory.filter((h) => h.positionId === position.id)
    : []
  const employeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name ?? id

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            History — {position?.id ?? ''}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-6 overflow-y-auto px-5 py-5'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Effective-dated, bitemporal records: the <b>effective period</b>{' '}
            says when the fact was true; <b>recorded at</b> says when it was
            entered. Past states stay reconstructible for any as-of date.
          </p>

          <section>
            <h3 className='text-neutral-1600 text-paragraph-sm mb-2 font-semibold'>
              Definition changes ({defRows.length})
            </h3>
            {defRows.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No definition changes recorded yet.
              </p>
            ) : (
              <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
                {defRows.map((h) => (
                  <div key={h.id} className='flex flex-col gap-1 px-3 py-2'>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {h.change}
                    </span>
                    <div className='text-paragraph-sm text-neutral-1000 flex flex-wrap items-center gap-x-4'>
                      <span>
                        Effective: <Period from={h.effectiveFrom} to={h.effectiveTo} />
                      </span>
                      <span>Recorded at {h.recordedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className='text-neutral-1600 text-paragraph-sm mb-2 font-semibold'>
              Employee assignments ({assignRows.length})
            </h3>
            {assignRows.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No employee has held this position yet.
              </p>
            ) : (
              <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
                {assignRows.map((h) => (
                  <div key={h.id} className='flex flex-col gap-1 px-3 py-2'>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {employeeName(h.employeeId)}
                    </span>
                    <div className='text-paragraph-sm text-neutral-1000 flex flex-wrap items-center gap-x-4'>
                      <span>
                        Effective: <Period from={h.effectiveFrom} to={h.effectiveTo} />
                      </span>
                      <span>Recorded at {h.recordedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
