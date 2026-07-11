import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import {
  ONBOARDING_STAGES,
  type OnboardingCase,
} from '../data/onboarding'
import { fmtDate } from '../data/shared'
import { type OnboardingStore } from '../hooks/use-onboarding'
import { StatusBadge } from './badges'

interface OnboardingDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onboardingCase: OnboardingCase | null
  store: OnboardingStore
}

/**
 * Stage-by-stage onboarding workspace: offer acceptance, document
 * submission/verification, asset assignment and induction completion.
 * Admin actions for non-user hires are recorded as proxy actions.
 */
export function OnboardingDetailSheet({
  open,
  onOpenChange,
  onboardingCase: c,
  store,
}: OnboardingDetailSheetProps) {
  const { hasRole } = useRole()
  if (!c) return null

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isEmployee = hasRole('Employee (User)')
  const proxy = isAdmin && !c.portalUser
  const stageIdx = ONBOARDING_STAGES.indexOf(c.currentStage)
  const live = (stage: (typeof ONBOARDING_STAGES)[number]) =>
    c.status === 'in-progress' && c.currentStage === stage

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {c.employeeName} · Onboarding
            <StatusBadge status={c.status} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {c.employeeCode} · {c.department} · {c.company} · starts{' '}
            {fmtDate(c.startDate)} · template {c.templateVersion}
            {!c.portalUser && ' · Non-User: actions recorded on their behalf'}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          {/* Stage tracker */}
          <div className='flex flex-wrap gap-2'>
            {ONBOARDING_STAGES.map((stage, i) => (
              <Badge
                key={stage}
                variant={
                  c.status === 'completed' || i < stageIdx
                    ? 'completed'
                    : i === stageIdx
                      ? 'open'
                      : 'pending'
                }
              >
                {i + 1}. {stage}
              </Badge>
            ))}
          </div>

          {/* Stage 1 — Offer Acceptance */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>1 · Offer Acceptance</h3>
            {c.offerAccepted ? (
              <p className='text-neutral-1000 text-xs'>
                Offer accepted — workflow advanced to Document Submission.
              </p>
            ) : (
              <div className='flex items-center gap-2'>
                {(isEmployee || isAdmin) && (
                  <Button size='sm' onClick={() => store.acceptOffer(c, proxy)}>
                    {proxy ? 'Record acceptance (on behalf)' : 'Accept offer'}
                  </Button>
                )}
                <span className='text-neutral-1000 text-xs'>
                  Mandatory — later stages stay locked until accepted.
                </span>
              </div>
            )}
          </section>
          <Separator />

          {/* Stage 2/3 — Documents */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              2–3 · Document Submission & Verification
            </h3>
            <div className='space-y-2'>
              {c.documents.map((d) => (
                <div
                  key={d.id}
                  className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>
                      {d.name}
                      {d.required && (
                        <span className='text-destructive'> *</span>
                      )}
                    </p>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className='flex shrink-0 gap-1'>
                    {live('Document Submission') &&
                      (d.status === 'missing' ||
                        d.status === 'correction-requested') &&
                      (isEmployee || isAdmin) && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => store.submitDocument(c, d.id, proxy)}
                        >
                          {d.status === 'correction-requested'
                            ? 'Resubmit'
                            : 'Upload'}
                        </Button>
                      )}
                    {live('Document Verification') &&
                      d.status === 'submitted' &&
                      isAdmin && (
                        <>
                          <Button
                            size='sm'
                            onClick={() => store.reviewDocument(c, d.id, 'verified')}
                          >
                            Verify
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              store.reviewDocument(c, d.id, 'correction-requested')
                            }
                          >
                            Request correction
                          </Button>
                        </>
                      )}
                    {live('Document Verification') &&
                      (d.status === 'missing' ||
                        d.status === 'correction-requested') &&
                      (isEmployee || isAdmin) && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => store.submitDocument(c, d.id, proxy)}
                        >
                          Resubmit
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
            {live('Document Submission') && (
              <Button size='sm' onClick={() => store.completeDocumentSubmission(c)}>
                Complete Document Submission
              </Button>
            )}
            {live('Document Verification') && isAdmin && (
              <Button size='sm' onClick={() => store.completeVerification(c)}>
                Complete Verification
              </Button>
            )}
          </section>
          <Separator />

          {/* Stage 4 — Assets */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>4 · Asset Assignment</h3>
            <div className='space-y-1'>
              {c.assets.map((a) => (
                <label
                  key={a.id}
                  className='flex items-center gap-2 rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
                >
                  <Checkbox
                    checked={a.assigned}
                    disabled={!live('Asset Assignment') || !isAdmin}
                    onCheckedChange={() => store.toggleAsset(c, a.id)}
                    variant='blue'
                  />
                  {a.name}
                </label>
              ))}
            </div>
            {live('Asset Assignment') && isAdmin && (
              <Button size='sm' onClick={() => store.completeAssetAssignment(c)}>
                Complete Asset Assignment
              </Button>
            )}
          </section>
          <Separator />

          {/* Stage 5 — Induction */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>5 · Induction Completion</h3>
            {c.status === 'completed' ? (
              <p className='text-neutral-1000 text-xs'>
                Onboarding complete — the closure event is in the audit trail.
              </p>
            ) : live('Induction Completion') && isAdmin ? (
              <Button size='sm' onClick={() => store.completeInduction(c)}>
                Mark induction complete & close onboarding
              </Button>
            ) : (
              <p className='text-neutral-1000 text-xs'>
                Available once every prior mandatory stage completes — until
                then this joiner is reported as still onboarding.
              </p>
            )}
          </section>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
