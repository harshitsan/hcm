import { useMemo, useState } from 'react'
import { ShareNetwork, UserPlus } from 'phosphor-react'
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
import { Input } from '@/components/ui/input'
import { useRole } from '@/context/role-context'
import { PORTAL_CANDIDATE_ID } from '../data/candidates'
import type { LetterTemplate } from '../data/config'
import { formatInr } from '../data/offers'
import type { Requisition } from '../data/requisitions'
import type { CandidatesStore } from '../hooks/use-candidates'
import type { OffersStore } from '../hooks/use-offers'
import { StatusBadge } from './badges'
import { SubmitReferralDialog } from './submit-referral-dialog'

interface PortalTabProps {
  candidatesStore: CandidatesStore
  offersStore: OffersStore
  requisitions: Requisition[]
  letterTemplates: LetterTemplate[]
}

/** Minimum years asked for in a requirements string, e.g. "6+ yrs Java". */
const requiredYears = (r: Requisition) => {
  const match = r.requirements.match(/(\d+)\s*\+?\s*yrs?/i)
  return match ? Number(match[1]) : 0
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
  // Posted-vacancy search + referrals (HR portal — posted vacancies)
  const [vacancyView, setVacancyView] = useState<'open' | 'closed'>('open')
  const [vacancySearch, setVacancySearch] = useState('')
  const [minExp, setMinExp] = useState('')
  const [referTo, setReferTo] = useState<Requisition | null>(null)

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
  // Posted vacancies with keyword + minimum-experience search across the
  // open (sourcing/approved) and closed (filled/closed) views.
  const vacancies = useMemo(() => {
    const q = vacancySearch.toLowerCase()
    const exp = minExp === '' ? null : Number(minExp)
    const statuses =
      vacancyView === 'open' ? ['sourcing', 'approved'] : ['filled', 'closed']
    return requisitions.filter((r) => {
      if (!statuses.includes(r.status)) return false
      if (exp !== null && requiredYears(r) < exp) return false
      if (!q) return true
      return [r.title, r.department, r.location, r.requirements, r.description]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [requisitions, vacancyView, vacancySearch, minExp])
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

      {/* Posted vacancies — searchable, open/closed views, share & refer */}
      <section>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Posted vacancies ({vacancies.length})
          </h3>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              placeholder='Search title, skills, location…'
              value={vacancySearch}
              onChange={(e) => setVacancySearch(e.target.value)}
              className='h-7 w-[210px]'
            />
            <Input
              type='number'
              min={0}
              placeholder='Min exp (yrs)'
              value={minExp}
              onChange={(e) => setMinExp(e.target.value)}
              className='h-7 w-[110px]'
            />
            {(['open', 'closed'] as const).map((v) => (
              <Button
                key={v}
                variant={vacancyView === v ? 'default' : 'outline'}
                className='h-7 px-2.5 text-xs capitalize'
                onClick={() => setVacancyView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
        <div className='grid gap-2 md:grid-cols-2'>
          {vacancies.map((r) => {
            const applied = myApplications.some(
              (a) => a.requisitionId === r.id
            )
            return (
              <div
                key={r.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {r.title}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {r.department} · {r.location} · {r.requirements} · closes{' '}
                    {r.closingDate}
                  </p>
                </div>
                {vacancyView === 'open' ? (
                  <div className='flex items-center gap-1.5'>
                    <Button
                      variant='outline'
                      className='h-7 gap-1 text-xs'
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(
                            `https://careers.satellitehr.in/jobs/${r.id.toLowerCase()}`
                          )
                          .catch(() => {})
                        toast.success('Link copied for sharing')
                      }}
                    >
                      <ShareNetwork size={14} /> Share
                    </Button>
                    <Button
                      variant='outline'
                      className='h-7 gap-1 text-xs'
                      onClick={() => setReferTo(r)}
                    >
                      <UserPlus size={14} /> Refer a candidate
                    </Button>
                    {applied ? (
                      <Badge variant='badge_active'>Applied</Badge>
                    ) : (
                      r.status === 'sourcing' && (
                        <Button
                          className='h-7 text-xs'
                          onClick={() => {
                            setApplyTo(r)
                            setResume('')
                          }}
                        >
                          Apply
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </div>
            )
          })}
          {vacancies.length === 0 && (
            <p className='text-neutral-1000 text-sm'>
              {vacancyView === 'open'
                ? 'No open vacancies match the search.'
                : 'No closed vacancies match the search.'}
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

      {/* Employee referral against a posted vacancy */}
      <SubmitReferralDialog
        open={referTo !== null}
        onOpenChange={(o) => !o && setReferTo(null)}
        requisition={referTo}
        candidatesStore={candidatesStore}
        referrerName={me.name}
      />
    </div>
  )
}
