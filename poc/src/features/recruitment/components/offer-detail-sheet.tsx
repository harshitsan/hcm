import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRole } from '@/context/role-context'
import { formatInr, type Offer } from '../data/offers'
import { OutOfBandBadge, StatusBadge } from './badges'

interface OfferDetailSheetProps {
  offer: Offer | null
  onOpenChange: (open: boolean) => void
  /** Opens Lifecycle → Onboarding for a converted hire. */
  onViewOnboarding?: () => void
}

/** Policy line shown wherever compensation is (or would be) displayed. */
export const COMP_POLICY_NOTE =
  "Compensation details are visible only to HR/Admin authors and the candidate's own offer letter."

/**
 * Individual offer drill-down — overview, admin-only compensation section,
 * a candidate-view preview toggle and the onboarding handoff summary.
 * Compensation stays masked everywhere else in the module.
 */
export function OfferDetailSheet({
  offer,
  onOpenChange,
  onViewOnboarding,
}: OfferDetailSheetProps) {
  const { hasRole } = useRole()
  const [candidateView, setCandidateView] = useState(false)

  if (!offer) return null

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const totalFor = (type: string) =>
    offer.breakup.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0)
  const fixedTotal = totalFor('Earning')
  const variableTotal = totalFor('Variable Pay')
  const deductionTotal = totalFor('Deduction')
  const employerTotal = totalFor('Employer Contribution')

  const letterBody = `Dear ${offer.candidateName},\n\nWe are pleased to offer you the position of ${offer.requisitionTitle} at our ${offer.location} office, at an annual CTC of ${formatInr(offer.annualCtc)}. Your expected date of joining is ${offer.expectedDoj}. Please respond to this offer on or before ${offer.responseDeadline}.\n\nYour detailed compensation breakup is enclosed below.`

  return (
    <Sheet open={Boolean(offer)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Offer {offer.id} — {offer.candidateName}
          </SheetTitle>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={offer.status} />
            {offer.offerLetterGenerated && (
              <Badge variant='completed'>Offer letter</Badge>
            )}
            {offer.joined && <Badge variant='badge_active'>Joined</Badge>}
            {offer.conversion && (
              <Badge variant='badge_active'>Handed off to Onboarding</Badge>
            )}
          </div>
        </SheetHeader>

        <div className='space-y-5 px-5 py-4'>
          {/* Candidate view — render exactly what the candidate receives */}
          {isAdmin && (
            <div className='flex items-center justify-between rounded-[8px] border border-gray-200 p-3'>
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  Candidate view
                </p>
                <p className='text-neutral-1000 text-paragraph-sm'>
                  Preview this offer exactly as {offer.candidateName} sees it —
                  their own offer letter with the compensation enclosed.
                </p>
              </div>
              <Switch
                checked={candidateView}
                onCheckedChange={setCandidateView}
              />
            </div>
          )}

          {candidateView ? (
            /* The candidate's own offer letter — comp is visible here by policy */
            <section className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
              <p className='whitespace-pre-line text-paragraph-sm text-neutral-1900'>
                {letterBody}
              </p>
              <div className='mt-3 rounded-[8px] border border-gray-200 bg-white'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className='text-right'>Annual amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.breakup.map((r, i) => (
                      <TableRow key={`${r.name}-${i}`}>
                        <TableCell className='text-sm'>{r.name}</TableCell>
                        <TableCell className='text-paragraph-sm text-neutral-1000'>
                          {r.type}
                        </TableCell>
                        <TableCell className='text-right text-sm'>
                          {formatInr(r.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                Template {offer.templateId} v{offer.templateVersion}
              </p>
            </section>
          ) : (
            <>
              {/* Overview */}
              <section>
                <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                  Overview
                </h3>
                <div className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm'>
                  <span className='text-neutral-1000'>Candidate</span>
                  <span>{offer.candidateName}</span>
                  <span className='text-neutral-1000'>Position</span>
                  <span>
                    {offer.requisitionTitle} ({offer.requisitionId})
                  </span>
                  <span className='text-neutral-1000'>Location</span>
                  <span>{offer.location}</span>
                  <span className='text-neutral-1000'>Expected joining date</span>
                  <span>{offer.expectedDoj}</span>
                  <span className='text-neutral-1000'>Response deadline</span>
                  <span>{offer.responseDeadline}</span>
                  {offer.releasedAt && (
                    <>
                      <span className='text-neutral-1000'>Released on</span>
                      <span>{offer.releasedAt}</span>
                    </>
                  )}
                  {offer.respondedAt && (
                    <>
                      <span className='text-neutral-1000'>Responded on</span>
                      <span>{offer.respondedAt}</span>
                    </>
                  )}
                  <span className='text-neutral-1000'>Approvals</span>
                  <span>
                    {offer.approvals
                      .map((a) => `L${a.level} ${a.approver}: ${a.decision}`)
                      .join(' · ')}
                  </span>
                </div>
              </section>

              {/* Compensation — HR/Admin authors only */}
              <section className='rounded-[8px] border border-gray-200 p-3'>
                <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                  Compensation
                </h3>
                {isAdmin ? (
                  <>
                    <div className='mb-2 flex flex-wrap items-center gap-2 text-sm'>
                      <span className='font-medium'>
                        Annual CTC {formatInr(offer.annualCtc)}
                      </span>
                      <span className='text-neutral-1000'>
                        band up to {formatInr(offer.bandMax)}
                      </span>
                      {offer.outOfBand && <OutOfBandBadge />}
                    </div>
                    <div className='mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
                      <span className='text-neutral-1000'>Fixed (earnings)</span>
                      <span>{formatInr(fixedTotal)}</span>
                      <span className='text-neutral-1000'>Variable pay</span>
                      <span>{formatInr(variableTotal)}</span>
                      <span className='text-neutral-1000'>Deductions</span>
                      <span>{formatInr(deductionTotal)}</span>
                      <span className='text-neutral-1000'>
                        Employer contributions
                      </span>
                      <span>{formatInr(employerTotal)}</span>
                    </div>
                    {offer.breakup.length > 0 && (
                      <div className='rounded-[8px] border border-gray-200 bg-white'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Component</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className='text-right'>
                                Annual amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {offer.breakup.map((r, i) => (
                              <TableRow key={`${r.name}-${i}`}>
                                <TableCell className='text-sm'>{r.name}</TableCell>
                                <TableCell className='text-paragraph-sm text-neutral-1000'>
                                  {r.type}
                                </TableCell>
                                <TableCell className='text-right text-sm'>
                                  {formatInr(r.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : (
                  <p className='text-sm'>••• Restricted</p>
                )}
                <p className='text-neutral-1000 text-paragraph-sm mt-2'>
                  {COMP_POLICY_NOTE}
                </p>
              </section>

              {/* Onboarding handoff summary */}
              {offer.conversion && (
                <section className='rounded-[8px] border border-gray-200 p-3'>
                  <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                    Onboarding handoff
                  </h3>
                  <div className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm'>
                    <span className='text-neutral-1000'>Employee record</span>
                    <span>{offer.conversion.employeeCode}</span>
                    <span className='text-neutral-1000'>Onboarding case</span>
                    <span>{offer.conversion.onboardingCaseId}</span>
                    <span className='text-neutral-1000'>User account</span>
                    <span>
                      {offer.conversion.userAccount
                        ? 'Created — the employee can sign in'
                        : 'Not created — can be added later'}
                    </span>
                    <span className='text-neutral-1000'>Handed off on</span>
                    <span>{offer.conversion.at}</span>
                  </div>
                  {onViewOnboarding && (
                    <Button
                      variant='outline'
                      className='mt-2 h-7 text-xs'
                      onClick={onViewOnboarding}
                    >
                      View onboarding
                    </Button>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
