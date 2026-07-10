import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fmtDate, pendingStep } from '../data/shared'
import {
  type ExitCase,
  type ExitConditionStatus,
} from '../data/exits'
import { type ExitsStore } from '../hooks/use-exits'
import { StatusBadge } from './badges'

const CONDITION_STATUSES: { value: ExitConditionStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'not-required', label: 'Not Required' },
]

interface ExitConditionsCardProps {
  exitCase: ExitCase
  store: ExitsStore
  /** Persona name recorded as the author of new conditions. */
  actor: string
  /** Approver/RM/admin — may add and update conditions. */
  canManage: boolean
  /** Employee viewers only see conditions after ALL approvals complete. */
  isEmployeeView: boolean
}

/**
 * Exit conditions grid — approver/RM adds description + due date after
 * suggesting an LWD; hidden from the employee until approvals complete.
 * The Experience Letter stays blocked until every condition is closed or
 * not-required.
 */
export function ExitConditionsCard({
  exitCase: e,
  store,
  actor,
  canManage,
  isEmployeeView,
}: ExitConditionsCardProps) {
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const conditions = e.conditions ?? []
  const allApproved = e.approvals.every((s) => s.status === 'approved')

  // Hidden from the employee until every approval completes.
  if (isEmployeeView && !allApproved) return null

  const current = pendingStep(e.approvals)
  const needsSuggestionFirst =
    e.status === 'pending-approval' &&
    current !== null &&
    !(e.lwdRecommendations ?? []).some((r) => r.approver === current.approver)

  const open = conditions.filter((c) => c.status === 'open').length

  return (
    <section className='space-y-2'>
      <h3 className='text-sm font-semibold'>
        Exit conditions{' '}
        <span className='text-neutral-1000 text-xs font-normal'>
          ({conditions.length} · {open} open)
        </span>
      </h3>
      {conditions.length === 0 ? (
        <p className='text-neutral-1000 text-xs'>
          No exit conditions recorded on this case.
        </p>
      ) : (
        conditions.map((c) => (
          <div
            key={c.id}
            className='flex items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
          >
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{c.description}</p>
              <p className='text-neutral-1000 text-xs'>
                due {fmtDate(c.dueDate)} · added by {c.addedBy} on {fmtDate(c.addedOn)}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              {canManage ? (
                <Select
                  value={c.status}
                  onValueChange={(v) =>
                    store.setConditionStatus(e, c.id, v as ExitConditionStatus)
                  }
                >
                  <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge status={c.status === 'not-required' ? 'closed' : c.status} />
              )}
            </div>
          </div>
        ))
      )}

      {canManage && (
        <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-3'>
          <div className='grid grid-cols-[1fr_150px] gap-2'>
            <Input
              placeholder='Condition description (e.g. complete KT for module X)'
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
            />
            <Input
              type='date'
              value={dueDate}
              onChange={(ev) => setDueDate(ev.target.value)}
            />
          </div>
          <Button
            size='sm'
            disabled={!description.trim() || !dueDate}
            onClick={() => {
              store.addCondition(e, description, dueDate, actor)
              setDescription('')
              setDueDate('')
            }}
          >
            Add condition
          </Button>
          {needsSuggestionFirst && (
            <p className='text-neutral-1000 text-xs'>
              Suggest an LWD for the current approval step first — conditions
              can only be added after a suggested LWD is on record.
            </p>
          )}
          <p className='text-neutral-1000 text-xs'>
            Hidden from the employee until all approvals complete. The
            Experience Letter is blocked until every condition is closed or
            not-required.
          </p>
        </div>
      )}
    </section>
  )
}
