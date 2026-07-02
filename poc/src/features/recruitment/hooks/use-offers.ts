import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Application } from '../data/candidates'
import type { EngineLogEntry, OfferApproverRule } from '../data/config'
import {
  seedOffers,
  type Offer,
  type OfferApproval,
} from '../data/offers'

interface UseOffersArgs {
  actor: string
  offerApproverRules: OfferApproverRule[]
  outOfBandApprover: string
  logEngine: (
    engine: EngineLogEntry['engine'],
    event: string,
    detail: string
  ) => void
  notify: (event: string, recipient: string) => void
  /** Marks the application hired and the requisition filled on conversion. */
  onConverted: (applicationId: string, requisitionId: string) => void
  onOfferCancelled: (applicationId: string) => void
  onOfferRefused: (applicationId: string) => void
}

export interface OfferDraft {
  templateId: string
  templateName: string
  templateVersion: number
  annualCtc: number
  bandMax: number
  location: string
  responseDeadline: string
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Offer lifecycle store — template generation, location-based approval with
 * out-of-band salary routing, release/accept/refuse/cancel, letters and
 * candidate conversion (TA-11, TA-12, TA-14, TA-18, TA-46, TA-47, TA-49,
 * TA-50).
 */
export function useOffers({
  actor,
  offerApproverRules,
  outOfBandApprover,
  logEngine,
  notify,
  onConverted,
  onOfferCancelled,
  onOfferRefused,
}: UseOffersArgs) {
  const [offers, setOffers] = useState<Offer[]>(seedOffers)

  const patchOffer = useCallback(
    (id: string, fn: (o: Offer) => Offer) => {
      setOffers((prev) => prev.map((o) => (o.id === id ? fn(o) : o)))
    },
    []
  )

  /** Generate from a template and route per the approver matrix (TA-11, TA-46). */
  const generateOffer = useCallback(
    (app: Application, draft: OfferDraft) => {
      const rule = offerApproverRules.find((r) =>
        r.locations.includes(draft.location)
      )
      const outOfBand = draft.annualCtc > draft.bandMax
      const approvals: OfferApproval[] = [
        ...(rule
          ? rule.approvers.map((approver, i) => ({
              level: i + 1,
              approver,
              approverRole: `Offer Approver — ${draft.location}`,
              decision: 'pending' as const,
            }))
          : [
              {
                level: 1,
                approver: 'Sunita Patil',
                approverRole: 'Default Offer Approver',
                decision: 'pending' as const,
              },
            ]),
      ]
      if (outOfBand)
        approvals.push({
          level: approvals.length + 1,
          approver: outOfBandApprover,
          approverRole: 'Out-of-Band Salary Approver',
          decision: 'pending',
        })
      const offer: Offer = {
        id: `OFR-${500 + Math.floor(Math.random() * 400)}`,
        applicationId: app.id,
        candidateName: app.candidateName,
        requisitionId: app.requisitionId,
        requisitionTitle: app.requisitionTitle,
        location: draft.location,
        templateId: draft.templateId,
        templateVersion: draft.templateVersion,
        annualCtc: draft.annualCtc,
        bandMax: draft.bandMax,
        outOfBand,
        status: 'pending-approval',
        responseDeadline: draft.responseDeadline,
        approvals,
        joiningLetterIssued: false,
        appointmentLetterIssued: false,
        joined: false,
      }
      setOffers((prev) => [offer, ...prev])
      logEngine(
        'workflow',
        `Offer ${offer.id} generated from ${draft.templateName} v${draft.templateVersion}`,
        `Merged candidate/role/compensation details; routed to ${approvals
          .map((a) => a.approver)
          .join(' → ')}${outOfBand ? ' (out-of-band salary — extra sign-off added)' : ''}`
      )
      notify('Offer pending approval', approvals[0].approver)
      toast.success(
        outOfBand
          ? `Offer generated — above band, extra approval by ${outOfBandApprover} required`
          : 'Offer generated and submitted for approval'
      )
    },
    [offerApproverRules, outOfBandApprover, logEngine, notify]
  )

  /** Approve/reject at the current pending level (TA-11). */
  const decideOffer = useCallback(
    (id: string, decision: 'approved' | 'rejected', comment: string) => {
      const offer = offers.find((o) => o.id === id)
      if (!offer) return
      const pending = offer.approvals.find((a) => a.decision === 'pending')
      if (!pending) return
      const approvals = offer.approvals.map((a) =>
        a.level === pending.level
          ? { ...a, decision, comment, decidedAt: new Date().toISOString() }
          : a
      )
      const remaining = approvals.some((a) => a.decision === 'pending')
      patchOffer(id, (o) => ({
        ...o,
        approvals,
        status:
          decision === 'rejected'
            ? 'rejected'
            : remaining
              ? 'pending-approval'
              : 'approved',
      }))
      logEngine(
        'workflow',
        `Offer ${id} ${decision} at L${pending.level}`,
        `Decision by ${actor}; timestamp recorded. ${
          decision === 'rejected'
            ? 'Offer cannot be distributed until revised and re-approved'
            : remaining
              ? 'Routed to next approver'
              : 'Fully approved — eligible for release'
        }`
      )
      toast.success(
        decision === 'rejected'
          ? 'Offer rejected — must be revised and re-approved before distribution'
          : remaining
            ? 'Approved — routed to next level'
            : 'Offer fully approved'
      )
    },
    [offers, patchOffer, logEngine, actor]
  )

  /** Release Offer view action — electronic distribution (TA-12, TA-47). */
  const releaseOffer = useCallback(
    (id: string) => {
      const offer = offers.find((o) => o.id === id)
      if (!offer) return
      if (offer.status !== 'approved') {
        toast.error('Only fully approved offers can be released')
        return
      }
      patchOffer(id, (o) => ({ ...o, status: 'released', releasedAt: today() }))
      notify('Offer released', offer.candidateName)
      toast.success(
        `Offer released to ${offer.candidateName} — candidate moved to offered stage`
      )
    },
    [offers, patchOffer, notify]
  )

  /** Candidate accepts or refuses electronically (TA-12, TA-47). */
  const respondToOffer = useCallback(
    (id: string, response: 'accepted' | 'refused') => {
      const offer = offers.find((o) => o.id === id)
      if (!offer) return
      patchOffer(id, (o) => ({
        ...o,
        status: response,
        respondedAt: today(),
      }))
      if (response === 'refused') onOfferRefused(offer.applicationId)
      logEngine(
        'workflow',
        `Offer ${id} ${response}`,
        `Candidate response tracked with timestamp${response === 'accepted' ? ' — eligible for conversion to employee' : ' — candidate retained in history'}`
      )
      toast.success(
        response === 'accepted'
          ? 'Offer accepted — candidate is now eligible for conversion'
          : 'Offer refusal recorded'
      )
    },
    [offers, patchOffer, logEngine, onOfferRefused]
  )

  /** Company-side withdrawal from the Cancel Offer view (TA-47). */
  const cancelOffer = useCallback(
    (id: string) => {
      const offer = offers.find((o) => o.id === id)
      if (!offer) return
      patchOffer(id, (o) => ({ ...o, status: 'cancelled' }))
      onOfferCancelled(offer.applicationId)
      notify('Offer cancelled', offer.candidateName)
      toast.success(
        'Offer cancelled — cancellation letter issued from the Cancel Offer template'
      )
    },
    [offers, patchOffer, notify, onOfferCancelled]
  )

  /** Joining letter for accepted hires (TA-49). */
  const issueJoiningLetter = useCallback(
    (id: string) => {
      patchOffer(id, (o) => ({ ...o, joiningLetterIssued: true }))
      const offer = offers.find((o) => o.id === id)
      if (offer) notify('Joining letter issued', offer.candidateName)
      toast.success(
        'Joining letter generated from the joining-letter template with candidate details merged'
      )
    },
    [offers, patchOffer, notify]
  )

  const markJoined = useCallback(
    (id: string) => {
      patchOffer(id, (o) => ({ ...o, joined: true }))
      toast.success('Candidate marked as Joined')
    },
    [patchOffer]
  )

  /** Appointment letter once status is Joined (TA-50). */
  const issueAppointmentLetter = useCallback(
    (id: string) => {
      const offer = offers.find((o) => o.id === id)
      if (!offer?.joined) {
        toast.error('Appointment letters are issued only after the hire has joined')
        return
      }
      patchOffer(id, (o) => ({ ...o, appointmentLetterIssued: true }))
      toast.success('Appointment letter issued from the appointment-letter template')
    },
    [offers, patchOffer]
  )

  /** Convert to employee with onboarding handoff (TA-14, TA-18). */
  const convertToEmployee = useCallback(
    (id: string, mode: 'employee-user' | 'employee-non-user', gaps: string[]) => {
      const offer = offers.find((o) => o.id === id)
      if (!offer) return false
      if (offer.status !== 'accepted') {
        toast.error('Only candidates with accepted offers can be converted')
        return false
      }
      if (gaps.length > 0) {
        toast.error(`Onboarding data gaps: ${gaps.join('; ')}`)
        return false
      }
      patchOffer(id, (o) => ({ ...o, convertedTo: mode }))
      onConverted(offer.applicationId, offer.requisitionId)
      logEngine(
        'workflow',
        `Candidate converted (${mode})`,
        `Personal, role, compensation and document data handed off to onboarding without re-entry; requisition ${offer.requisitionId} marked filled${mode === 'employee-non-user' ? '; no login provisioned — can be upgraded later' : ''}`
      )
      notify('New hire ready for onboarding', 'Onboarding module')
      toast.success(
        mode === 'employee-user'
          ? `${offer.candidateName} converted — appears in onboarding as a new hire`
          : `${offer.candidateName} converted as Employee (Non-User) — no login provisioned`
      )
      return true
    },
    [offers, patchOffer, logEngine, notify, onConverted]
  )

  return {
    offers,
    generateOffer,
    decideOffer,
    releaseOffer,
    respondToOffer,
    cancelOffer,
    issueJoiningLetter,
    markJoined,
    issueAppointmentLetter,
    convertToEmployee,
  }
}

export type OffersStore = ReturnType<typeof useOffers>
