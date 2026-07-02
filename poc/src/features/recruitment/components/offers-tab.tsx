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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import type { Application } from '../data/candidates'
import type { ChecklistQuestion } from '../data/config'
import { formatInr, type Offer } from '../data/offers'
import type { OffersStore } from '../hooks/use-offers'
import { OutOfBandBadge, StatusBadge } from './badges'

interface OffersTabProps {
  store: OffersStore
  applications: Application[]
  checklistQuestions: ChecklistQuestion[]
}

/** Kensium-style offer lifecycle views (TA-47, TA-49, TA-50). */
const OFFER_VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'pending-approval', label: 'Pending Approval' },
  { key: 'release', label: 'Release Offer' },
  { key: 'cancel', label: 'Cancel Offer' },
  { key: 'refuse', label: 'Refuse Offer' },
  { key: 'joining', label: 'Joining Letter' },
  { key: 'appointment', label: 'Appointment Letter' },
] as const

type OfferView = (typeof OFFER_VIEWS)[number]['key']

function inView(o: Offer, view: OfferView) {
  switch (view) {
    case 'all':
      return true
    case 'pending-approval':
      return o.status === 'pending-approval'
    case 'release':
      return o.status === 'approved'
    case 'cancel':
      return ['released', 'accepted'].includes(o.status)
    case 'refuse':
      return ['released', 'refused'].includes(o.status)
    case 'joining':
      return o.status === 'accepted'
    case 'appointment':
      return o.status === 'accepted' && o.joined
  }
}

/**
 * Offer desk — template-generated offers routed through location + out-of-band
 * approval, release / cancel / refuse lifecycle views, joining and appointment
 * letters, expiry flags and conversion to employee (TA-11, TA-12, TA-14,
 * TA-18, TA-46, TA-47, TA-49, TA-50).
 */
export function OffersTab({
  store,
  applications,
  checklistQuestions,
}: OffersTabProps) {
  const { hasRole } = useRole()
  const [view, setView] = useState<OfferView>('all')
  const [search, setSearch] = useState('')
  const [deciding, setDeciding] = useState<Offer | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [comment, setComment] = useState('')
  const [converting, setConverting] = useState<Offer | null>(null)
  const [convertMode, setConvertMode] = useState<
    'employee-user' | 'employee-non-user'
  >('employee-user')

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isCandidate = hasRole('Employee (User)')
  const today = new Date().toISOString().slice(0, 10)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    OFFER_VIEWS.forEach(({ key }) => {
      c[key] = store.offers.filter((o) => inView(o, key)).length
    })
    return c
  }, [store.offers])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return store.offers.filter(
      (o) => inView(o, view) && (!q || o.candidateName.toLowerCase().includes(q))
    )
  }, [store.offers, view, search])

  /** Missing mandatory pre-onboarding data blocks conversion (TA-14). */
  const conversionGaps = (offer: Offer): string[] => {
    const app = applications.find((a) => a.id === offer.applicationId)
    return checklistQuestions
      .filter((q) => q.mandatory && !app?.checklist[q.id])
      .map((q) => q.question)
  }

  const decide = () => {
    if (!deciding) return
    store.decideOffer(deciding.id, decision, comment)
    setDeciding(null)
    setComment('')
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {OFFER_VIEWS.map(({ key, label }) => (
            <Button
              key={key}
              variant={view === key ? 'default' : 'outline'}
              className='h-7 px-2.5 text-xs'
              onClick={() => setView(key)}
            >
              {label} ({counts[key]})
            </Button>
          ))}
        </div>
        <Input
          placeholder='Search by candidate name…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-7 w-[200px]'
        />
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Requisition</TableHead>
              <TableHead>CTC</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => {
              const overdue =
                o.status === 'released' && o.responseDeadline < today
              return (
                <TableRow key={o.id}>
                  <TableCell className='font-medium'>{o.id}</TableCell>
                  <TableCell className='text-sm'>{o.candidateName}</TableCell>
                  <TableCell className='text-sm'>
                    {o.requisitionId} · {o.location}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1 text-sm'>
                      {formatInr(o.annualCtc)}
                      {o.outOfBand && <OutOfBandBadge />}
                    </div>
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {o.templateId} v{o.templateVersion}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {o.approvals
                      .map((a) => `L${a.level} ${a.approver}: ${a.decision}`)
                      .join(' · ')}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {o.responseDeadline}
                    {overdue && (
                      <Badge variant='overdue' className='ml-1'>
                        Expired — follow up
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap items-center gap-1'>
                      <StatusBadge status={o.status} />
                      {o.joiningLetterIssued && (
                        <Badge variant='completed'>Joining letter</Badge>
                      )}
                      {o.joined && <Badge variant='badge_active'>Joined</Badge>}
                      {o.appointmentLetterIssued && (
                        <Badge variant='completed'>Appointment letter</Badge>
                      )}
                      {o.convertedTo && (
                        <Badge variant='badge_active'>
                          {o.convertedTo === 'employee-user'
                            ? 'Converted (User)'
                            : 'Converted (Non-User)'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-wrap justify-end gap-1'>
                      {isAdmin && o.status === 'pending-approval' && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => setDeciding(o)}
                        >
                          Decide
                        </Button>
                      )}
                      {isAdmin && o.status === 'approved' && (
                        <Button
                          className='h-6 px-2 text-xs'
                          onClick={() => store.releaseOffer(o.id)}
                        >
                          Release
                        </Button>
                      )}
                      {(isCandidate || isAdmin) && o.status === 'released' && (
                        <>
                          <Button
                            className='h-6 px-2 text-xs'
                            onClick={() => store.respondToOffer(o.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => store.respondToOffer(o.id, 'refused')}
                          >
                            Refuse
                          </Button>
                        </>
                      )}
                      {isAdmin &&
                        ['released', 'accepted'].includes(o.status) &&
                        !o.convertedTo && (
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => store.cancelOffer(o.id)}
                          >
                            Cancel offer
                          </Button>
                        )}
                      {isAdmin && o.status === 'accepted' && (
                        <>
                          {!o.joiningLetterIssued && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.issueJoiningLetter(o.id)}
                            >
                              Issue joining letter
                            </Button>
                          )}
                          {!o.joined && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.markJoined(o.id)}
                            >
                              Mark joined
                            </Button>
                          )}
                          {o.joined && !o.appointmentLetterIssued && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.issueAppointmentLetter(o.id)}
                            >
                              Issue appointment letter
                            </Button>
                          )}
                          {!o.convertedTo && (
                            <Button
                              className='h-6 px-2 text-xs'
                              onClick={() => setConverting(o)}
                            >
                              Convert to employee
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className='text-neutral-1000 text-center'>
                  No offers in this view
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* TA-11: multi-level offer approval with recorded decisions */}
      <Dialog
        open={deciding !== null}
        onOpenChange={(o) => !o && setDeciding(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Offer approval — {deciding?.id}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1 text-sm'>
              {deciding?.approvals.map((a) => (
                <div
                  key={a.level}
                  className='flex items-center justify-between rounded border border-gray-200 px-2 py-1.5'
                >
                  <span className='text-neutral-1900'>
                    L{a.level} · {a.approver} ({a.approverRole})
                  </span>
                  <StatusBadge status={a.decision} />
                </div>
              ))}
            </div>
            <RadioGroup
              value={decision}
              onValueChange={(v) => setDecision(v as 'approved' | 'rejected')}
              className='flex gap-4'
            >
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='approved' id='ofr-approve' />
                <Label htmlFor='ofr-approve'>Approve</Label>
              </div>
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='rejected' id='ofr-reject' />
                <Label htmlFor='ofr-reject'>Reject</Label>
              </div>
            </RadioGroup>
            <Textarea
              placeholder='Comment (recorded with approver and timestamp)'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button onClick={decide}>Record decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TA-14, TA-18: conversion with onboarding handoff and gap check */}
      <Dialog
        open={converting !== null}
        onOpenChange={(o) => !o && setConverting(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              Convert {converting?.candidateName} to employee
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <RadioGroup
              value={convertMode}
              onValueChange={(v) =>
                setConvertMode(v as 'employee-user' | 'employee-non-user')
              }
              className='space-y-1'
            >
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='employee-user' id='cv-user' />
                <Label htmlFor='cv-user'>
                  Employee (User) — provision a login
                </Label>
              </div>
              <div className='flex items-center gap-1.5'>
                <RadioGroupItem value='employee-non-user' id='cv-non-user' />
                <Label htmlFor='cv-non-user'>
                  Employee (Non-User) — no system access; upgradeable later
                </Label>
              </div>
            </RadioGroup>
            {converting && conversionGaps(converting).length > 0 && (
              <p className='text-paragraph-sm text-red-1400'>
                Onboarding data gaps (complete the pre-onboarding checklist
                first): {conversionGaps(converting).join('; ')}
              </p>
            )}
            <p className='text-paragraph-sm text-neutral-1000'>
              Captured personal, role, compensation and document data is handed
              off to onboarding without re-entry; the source requisition is
              marked filled and the candidate becomes Hired.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConverting(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (
                  converting &&
                  store.convertToEmployee(
                    converting.id,
                    convertMode,
                    conversionGaps(converting)
                  )
                )
                  setConverting(null)
              }}
            >
              Convert &amp; hand off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
