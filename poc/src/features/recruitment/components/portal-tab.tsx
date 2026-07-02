import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useRole } from '@/context/role-context'
import { PORTAL_CANDIDATE_ID } from '../data/candidates'
import type { LetterTemplate } from '../data/config'
import { formatInr } from '../data/offers'
import type { Requisition } from '../data/requisitions'
import type { CandidatesStore } from '../hooks/use-candidates'
import type { OffersStore } from '../hooks/use-offers'
import { StatusBadge } from './badges'

interface PortalTabProps {
  candidatesStore: CandidatesStore
  offersStore: OffersStore
  requisitions: Requisition[]
  letterTemplates: LetterTemplate[]
}

/**
 * Self-service candidate portal (TA-31, TA-12) — apply with a resume upload,
 * track stage / interviews / pending actions, and respond to offers, all as
 * the demo candidate persona.
 */
export function PortalTab({
  candidatesStore,
  offersStore,
  requisitions,
  letterTemplates,
}: PortalTabProps) {
  const { role } = useRole()
  const [applyTo, setApplyTo] = useState<Requisition | null>(null)
  const [resume, setResume] = useState('')
  const [viewOfferId, setViewOfferId] = useState<string | null>(null)

  const me = candidatesStore.candidates.find(
    (c) => c.id === PORTAL_CANDIDATE_ID
  )
  const myApplications = useMemo(
    () =>
      candidatesStore.applications.filter(
        (a) => a.candidateId === PORTAL_CANDIDATE_ID
      ),
    [candidatesStore.applications]
  )
  const myOffers = offersStore.offers.filter((o) =>
    myApplications.some((a) => a.id === o.applicationId)
  )
  const openPositions = requisitions.filter((r) => r.status === 'sourcing')
  const viewOffer = myOffers.find((o) => o.id === viewOfferId) ?? null
  const offerTemplate = letterTemplates.find(
    (t) => t.id === viewOffer?.templateId
  )

  if (!me) return null

  return (
    <div className='w-full space-y-5'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 font-medium'>
          Candidate portal — signed in as {me.name}
        </p>
        <p className='text-paragraph-sm text-neutral-1000'>
          {me.email} · viewing as role “{role}”. Screens render responsively
          from metadata-driven forms with the tenant's theming applied.
        </p>
      </div>

      {/* Apply to open requisitions */}
      <section>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Open positions ({openPositions.length})
        </h3>
        <div className='grid gap-2 md:grid-cols-2'>
          {openPositions.map((r) => {
            const applied = myApplications.some(
              (a) => a.requisitionId === r.id
            )
            return (
              <div
                key={r.id}
                className='flex items-center justify-between rounded-[8px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {r.title}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {r.department} · {r.location} · closes {r.closingDate}
                  </p>
                </div>
                {applied ? (
                  <Badge variant='badge_active'>Applied</Badge>
                ) : (
                  <Button
                    className='h-7 text-xs'
                    onClick={() => {
                      setApplyTo(r)
                      setResume('')
                    }}
                  >
                    Apply
                  </Button>
                )}
              </div>
            )
          })}
          {openPositions.length === 0 && (
            <p className='text-neutral-1000 text-sm'>
              No positions are currently sourcing.
            </p>
          )}
        </div>
      </section>

      {/* Track my applications */}
      <section>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          My applications ({myApplications.length})
        </h3>
        <div className='space-y-2'>
          {myApplications.map((a) => {
            const upcoming = a.interviews.filter(
              (iv) => iv.status === 'scheduled'
            )
            const pendingAction =
              a.status === 'offer'
                ? 'Review your offer below'
                : upcoming.length > 0
                  ? `Attend interview on ${upcoming[0].date} at ${upcoming[0].time}`
                  : 'No pending action — we will keep you posted'
            return (
              <div
                key={a.id}
                className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex items-center justify-between'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {a.requisitionTitle} ({a.requisitionId})
                  </p>
                  <StatusBadge status={a.status} />
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Applied {a.appliedAt} · resume: {a.resume}
                </p>
                {upcoming.map((iv) => (
                  <p key={iv.id} className='text-paragraph-sm text-neutral-1600'>
                    Interview — Round {iv.round} ({iv.roundName}) on {iv.date}{' '}
                    {iv.time}, {iv.mode}
                  </p>
                ))}
                <p className='text-paragraph-sm text-blue-1400'>
                  Pending action: {pendingAction}
                </p>
              </div>
            )
          })}
          {myApplications.length === 0 && (
            <p className='text-neutral-1000 text-sm'>No applications yet.</p>
          )}
        </div>
      </section>

      {/* Offers — view letter, accept or reject (TA-12, TA-31) */}
      <section>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          My offers ({myOffers.length})
        </h3>
        <div className='space-y-2'>
          {myOffers.map((o) => (
            <div
              key={o.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
            >
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {o.requisitionTitle} — {formatInr(o.annualCtc)} p.a.
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Respond by {o.responseDeadline}
                </p>
              </div>
              <div className='flex items-center gap-1.5'>
                <StatusBadge status={o.status} />
                {['released', 'accepted', 'refused'].includes(o.status) && (
                  <Button
                    variant='outline'
                    className='h-7 text-xs'
                    onClick={() => setViewOfferId(o.id)}
                  >
                    View offer letter
                  </Button>
                )}
                {o.status === 'released' && (
                  <>
                    <Button
                      className='h-7 text-xs'
                      onClick={() => offersStore.respondToOffer(o.id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant='outline'
                      className='h-7 text-xs'
                      onClick={() => offersStore.respondToOffer(o.id, 'refused')}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {myOffers.length === 0 && (
            <p className='text-neutral-1000 text-sm'>No offers yet.</p>
          )}
        </div>
      </section>

      {/* Metadata-driven application form (TA-31) */}
      <Dialog open={applyTo !== null} onOpenChange={(o) => !o && setApplyTo(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Apply — {applyTo?.title}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Resume file</p>
              <Input
                placeholder='e.g. kiran-rao-resume-v2.pdf'
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              Your details ({me.name}, {me.email}) are pre-filled from your
              profile; the application form renders from configured metadata.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setApplyTo(null)}>
              Cancel
            </Button>
            <Button
              disabled={resume.length < 5}
              onClick={() => {
                if (applyTo)
                  candidatesStore.applyToRequisition(
                    me,
                    applyTo.id,
                    applyTo.title,
                    resume
                  )
                setApplyTo(null)
              }}
            >
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer letter viewer */}
      <Dialog
        open={viewOffer !== null}
        onOpenChange={(o) => !o && setViewOfferId(null)}
      >
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>
              Offer letter — {viewOffer?.id} (template v
              {viewOffer?.templateVersion})
            </DialogTitle>
          </DialogHeader>
          <p className='text-neutral-1900 text-sm'>
            {viewOffer && offerTemplate
              ? offerTemplate.content
                  .replace('{{candidate_name}}', viewOffer.candidateName)
                  .replace('{{position}}', viewOffer.requisitionTitle)
                  .replace('{{location}}', viewOffer.location)
                  .replace('{{ctc}}', formatInr(viewOffer.annualCtc))
                  .replace('{{deadline}}', viewOffer.responseDeadline)
              : '—'}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
