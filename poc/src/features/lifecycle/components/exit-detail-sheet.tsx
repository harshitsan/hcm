import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import { type ExitCase } from '../data/exits'
import { fmtDate, todayISO } from '../data/shared'
import { type ExitsStore } from '../hooks/use-exits'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'

interface ExitDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exitCase: ExitCase | null
  store: ExitsStore
}

function noticeProgress(e: ExitCase) {
  const start = new Date(e.requestedOn).getTime()
  const end = new Date(e.lastWorkingDay).getTime()
  const now = new Date(todayISO()).getTime()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

/**
 * Exit workspace: approval + notice tracking, parallel functional clearance,
 * LWD-relative offboarding tasks, questionnaire and finalization.
 */
export function ExitDetailSheet({
  open,
  onOpenChange,
  exitCase: e,
  store,
}: ExitDetailSheetProps) {
  const { hasRole } = useRole()
  if (!e) return null

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isEmployee = hasRole('Employee (User)')
  const progress = noticeProgress(e)
  const outstanding = e.clearances.filter((c) => c.status !== 'cleared')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[600px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {e.employeeName} · Exit ({e.exitType})
            <StatusBadge status={e.status} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {e.employeeCode} · {e.department} · {e.location} · requested{' '}
            {fmtDate(e.requestedOn)} · raised by {e.raisedBy}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          {/* Notice period */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Notice period</h3>
            <div className='rounded-[6px] border border-gray-200 px-3 py-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>
                  {e.noticePeriodDays} days · last working day{' '}
                  {fmtDate(e.lastWorkingDay)}
                </span>
                <span className='text-neutral-1000 text-xs'>
                  {progress}% served
                </span>
              </div>
              <div className='bg-neutral-2000 mt-2 h-1.5 w-full rounded-full'>
                <div
                  className='bg-blue-1400 h-1.5 rounded-full'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>
          <Separator />

          {/* Approvals */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Exit approval workflow</h3>
            <ApprovalSteps
              steps={e.approvals}
              disabled={e.status !== 'pending-approval'}
              canAct={() => isAdmin}
              onApprove={() => store.approveStep(e)}
              onReject={(note) => store.rejectStep(e, note)}
            />
            {e.status === 'approved' && isAdmin && (
              <Button size='sm' onClick={() => store.initiateClearance(e)}>
                Initiate parallel clearance
              </Button>
            )}
          </section>
          <Separator />

          {/* Clearance */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Functional clearance (parallel)
            </h3>
            {e.clearances.map((c) => (
              <div
                key={c.functionName}
                className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>
                    {c.functionName}{' '}
                    <span className='text-neutral-1000 text-xs'>
                      owner: {c.owner}
                    </span>
                  </p>
                  {c.note && (
                    <p className='text-neutral-1000 truncate text-xs'>{c.note}</p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <StatusBadge status={c.status} />
                  {e.status === 'clearance-in-progress' &&
                    c.status !== 'cleared' &&
                    isAdmin && (
                      <>
                        <Button
                          size='sm'
                          onClick={() =>
                            store.setClearance(e, c.functionName, 'cleared', null)
                          }
                        >
                          Clear
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            store.setClearance(
                              e,
                              c.functionName,
                              'rejected',
                              'Items pending with the employee'
                            )
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                </div>
              </div>
            ))}
            {outstanding.length > 0 && e.status === 'clearance-in-progress' && (
              <p className='text-neutral-1000 text-xs'>
                Outstanding: {outstanding.map((c) => `${c.functionName} (${c.owner})`).join(', ')}
              </p>
            )}
            {e.status === 'clearance-in-progress' && isAdmin && (
              <Button size='sm' onClick={() => store.finalizeExit(e)}>
                Finalize exit
              </Button>
            )}
            {e.status === 'finalized' && (
              <Badge variant='completed'>
                Exit closed — completion recorded in the audit trail
              </Badge>
            )}
          </section>
          <Separator />

          {/* Offboarding tasks */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Offboarding tasks (LWD-relative)
            </h3>
            {e.tasks.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No tasks generated for this exit type.
              </p>
            ) : (
              e.tasks.map((t) => (
                <label
                  key={t.id}
                  className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <span className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={t.done}
                      disabled={!isAdmin || e.status === 'finalized'}
                      onCheckedChange={() => store.toggleTask(e, t.id)}
                      variant='blue'
                    />
                    {t.name}
                  </span>
                  <span className='text-neutral-1000 text-xs'>
                    {t.owner} · {t.due}
                  </span>
                </label>
              ))
            )}
          </section>
          <Separator />

          {/* Questionnaire */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Exit questionnaire</h3>
            {e.questionnaire.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No questionnaire configured for this exit type (or the
                questionnaire process is disabled).
              </p>
            ) : (
              <>
                {e.questionnaire.map((q) => (
                  <div key={q.questionId} className='space-y-1'>
                    <p className='text-sm'>
                      {q.question}
                      {q.mandatory && <span className='text-destructive'> *</span>}
                      <span className='text-neutral-1000 text-xs'>
                        {' '}
                        · {q.responder}
                      </span>
                    </p>
                    {e.questionnaireSubmitted ? (
                      <p className='text-neutral-1000 rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'>
                        {q.answer ?? '—'}
                      </p>
                    ) : (
                      <Input
                        value={q.answer ?? ''}
                        disabled={!(isEmployee || isAdmin)}
                        placeholder='Your answer'
                        onChange={(ev) =>
                          store.answerQuestion(e.id, q.questionId, ev.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
                {!e.questionnaireSubmitted && (isEmployee || isAdmin) && (
                  <Button size='sm' onClick={() => store.submitQuestionnaire(e)}>
                    Submit questionnaire
                  </Button>
                )}
                {e.questionnaireSubmitted && (
                  <Badge variant='completed'>
                    Responses recorded — available to HR for exit analysis
                  </Badge>
                )}
              </>
            )}
          </section>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
