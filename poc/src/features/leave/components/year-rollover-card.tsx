import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { type BalancesStore } from '../hooks/use-balances'

const CARRY_FORWARD_CAP = 15

/**
 * Admin year-end rollover action behind the registry event "Leave year
 * rollover completed": carries remaining balances forward (capped) and
 * resets the year counters, with a ConfirmDialog and an audit-trail entry.
 */
export function YearRolloverCard({ balances }: { balances: BalancesStore }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
        Leave year rollover
      </h3>
      <p className='text-neutral-1000 mb-3 text-xs'>
        Closes the current leave year: unused paid balances carry forward up
        to {CARRY_FORWARD_CAP} days per the policy, year counters reset, and
        an immutable audit entry is written. Employees are notified.
      </p>
      <Button className='h-7' onClick={() => setConfirmOpen(true)}>
        Run year-end rollover…
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title='Run the leave year rollover?'
        desc={`This carries every employee's remaining balance forward (capped at ${CARRY_FORWARD_CAP} days), resets taken/scheduled/pending counters for the new year and notifies employees. The action is recorded in the activity log and cannot be undone.`}
        confirmText='Run rollover'
        handleConfirm={() => {
          balances.runYearRollover(CARRY_FORWARD_CAP)
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
