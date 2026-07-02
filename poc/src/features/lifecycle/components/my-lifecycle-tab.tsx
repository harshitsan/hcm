import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import { type ExitTypeDef } from '../data/config'
import { ONBOARDING_STAGES } from '../data/onboarding'
import { type PeerReview } from '../data/probation'
import { SELF_EMPLOYEE, fmtDate } from '../data/shared'
import { type ExitsStore } from '../hooks/use-exits'
import { type LifecycleLog } from '../hooks/use-lifecycle-log'
import { type OnboardingStore } from '../hooks/use-onboarding'
import { type ProbationStore } from '../hooks/use-probation'
import { StatusBadge } from './badges'
import { SectionCard } from './config-widgets'
import { ExitDetailSheet } from './exit-detail-sheet'
import { NewExitOverlay } from './new-exit-overlay'
import { OnboardingDetailSheet } from './onboarding-detail-sheet'

interface MyLifecycleTabProps {
  onboarding: OnboardingStore
  exits: ExitsStore
  probation: ProbationStore
  log: LifecycleLog
  exitTypes: ExitTypeDef[]
}

/**
 * Metadata-driven self-service portal for Employee (User): my onboarding
 * tasks, exit request + tracking, peer reviews assigned to me and the
 * templated notification feed. Non-user employees see the proxy notice.
 */
export function MyLifecycleTab({
  onboarding,
  exits,
  probation,
  log,
  exitTypes,
}: MyLifecycleTabProps) {
  const { role } = useRole()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [exitFormOpen, setExitFormOpen] = useState(false)
  const [exitDetailOpen, setExitDetailOpen] = useState(false)
  const [peerDialog, setPeerDialog] = useState<PeerReview | null>(null)
  const [peerText, setPeerText] = useState('')

  if (role === 'Employee (Non-User)') {
    return (
      <SectionCard
        title='No portal access'
        description='You are registered as an Employee (Non-User).'
      >
        <p className='text-neutral-1000 text-sm'>
          Your Company Admin completes onboarding, document submission and exit
          formalities on your behalf. Every proxy action is captured in the
          audit trail as “performed on behalf of” you.
        </p>
      </SectionCard>
    )
  }

  const myOnboarding =
    onboarding.cases.find((c) => c.employeeName === SELF_EMPLOYEE) ?? null
  const myExit = exits.exits.find((e) => e.employeeName === SELF_EMPLOYEE) ?? null
  const myPeerReviews = probation.peerReviews.filter(
    (r) => r.reviewer === SELF_EMPLOYEE
  )
  const myNotifications = log.notifications.filter(
    (n) => n.recipient === SELF_EMPLOYEE
  )

  return (
    <div className='w-full'>
      {/* My onboarding */}
      <SectionCard
        title='My onboarding'
        description='Forms and required document uploads render from the configured checklist template.'
        actions={
          myOnboarding && (
            <Button size='sm' onClick={() => setOnboardingOpen(true)}>
              Open my tasks
            </Button>
          )
        }
      >
        {myOnboarding ? (
          <div className='space-y-2'>
            <div className='flex flex-wrap gap-2'>
              {ONBOARDING_STAGES.map((stage, i) => {
                const idx = ONBOARDING_STAGES.indexOf(myOnboarding.currentStage)
                return (
                  <Badge
                    key={stage}
                    variant={
                      myOnboarding.status === 'completed' || i < idx
                        ? 'completed'
                        : i === idx
                          ? 'open'
                          : 'pending'
                    }
                  >
                    {i + 1}. {stage}
                  </Badge>
                )
              })}
            </div>
            <p className='text-neutral-1000 text-xs'>
              Current stage: {myOnboarding.currentStage} · template{' '}
              {myOnboarding.templateVersion} ·{' '}
              {
                myOnboarding.documents.filter(
                  (d) => d.required && d.status !== 'verified'
                ).length
              }{' '}
              required document(s) outstanding
            </p>
          </div>
        ) : (
          <p className='text-neutral-1000 text-sm'>
            No onboarding in progress for you.
          </p>
        )}
      </SectionCard>

      {/* My exit */}
      <SectionCard
        title='My exit'
        description='Raise an exit request and track approval status and notice period progress.'
        actions={
          myExit ? (
            <Button size='sm' onClick={() => setExitDetailOpen(true)}>
              View my exit
            </Button>
          ) : (
            <Button size='sm' onClick={() => setExitFormOpen(true)}>
              Raise exit request
            </Button>
          )
        }
      >
        {myExit ? (
          <div className='flex flex-wrap items-center gap-3 text-sm'>
            <StatusBadge status={myExit.status} />
            <span>
              {myExit.exitType} · requested {fmtDate(myExit.requestedOn)} ·
              notice {myExit.noticePeriodDays} days · LWD{' '}
              {fmtDate(myExit.lastWorkingDay)}
            </span>
          </div>
        ) : (
          <p className='text-neutral-1000 text-sm'>
            No exit request on file. The request form renders the configured
            fields and routes through the exit approval workflow.
          </p>
        )}
      </SectionCard>

      {/* Peer reviews assigned to me */}
      <SectionCard
        title='Peer reviews assigned to me'
        description='Your feedback informs your colleague’s confirmation decision.'
      >
        {myPeerReviews.length === 0 ? (
          <p className='text-neutral-1000 text-sm'>
            No records found (0). You have no pending peer reviews.
          </p>
        ) : (
          <div className='space-y-2'>
            {myPeerReviews.map((r) => (
              <div
                key={r.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div>
                  <p className='text-sm font-medium'>{r.employeeName}</p>
                  <p className='text-neutral-1000 text-xs'>
                    requested by {r.requestedBy} · due {fmtDate(r.reviewDate)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <StatusBadge status={r.status} />
                  {r.status === 'Pending Approval' && (
                    <Button
                      size='sm'
                      onClick={() => {
                        setPeerText('')
                        setPeerDialog(r)
                      }}
                    >
                      Respond
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        title='My notifications'
        description='Templated notifications from the notification engine — tasks, approvals, reminders and escalations.'
      >
        {myNotifications.length === 0 ? (
          <p className='text-neutral-1000 text-sm'>No notifications.</p>
        ) : (
          <div className='space-y-2'>
            {myNotifications.map((n) => (
              <div
                key={n.id}
                className='rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>{n.title}</p>
                  <Badge
                    variant={
                      n.kind === 'escalation'
                        ? 'overdue'
                        : n.kind === 'reminder'
                          ? 'pending'
                          : 'open'
                    }
                  >
                    {n.kind}
                  </Badge>
                </div>
                <p className='text-neutral-1000 text-xs'>{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <OnboardingDetailSheet
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onboardingCase={myOnboarding}
        store={onboarding}
      />
      <NewExitOverlay
        open={exitFormOpen}
        onOpenChange={setExitFormOpen}
        exitTypes={exitTypes}
        raisedBy='Employee'
        defaults={{
          employeeName: SELF_EMPLOYEE,
          employeeCode: 'EMP-2411',
          department: 'Engineering',
          location: 'Hyderabad',
          positionLevel: 'L1 - Associate',
        }}
        onSubmit={exits.addExit}
      />
      <ExitDetailSheet
        open={exitDetailOpen}
        onOpenChange={setExitDetailOpen}
        exitCase={myExit}
        store={exits}
      />

      <Dialog
        open={peerDialog !== null}
        onOpenChange={(o) => {
          if (!o) setPeerDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Peer review · {peerDialog?.employeeName}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder='Share specific, constructive feedback'
            value={peerText}
            onChange={(e) => setPeerText(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setPeerDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!peerText.trim()) {
                  toast.error('Feedback is required before submitting')
                  return
                }
                if (peerDialog)
                  probation.submitPeerReview(peerDialog.id, peerText.trim())
                setPeerDialog(null)
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
