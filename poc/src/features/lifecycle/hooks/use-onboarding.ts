import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ONBOARDING_STAGES,
  STANDARD_ASSETS,
  STANDARD_DOCS,
  seedOnboarding,
  type OnboardingCase,
} from '../data/onboarding'
import { shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

export interface OnboardingDraft {
  employeeName: string
  employeeCode: string
  department: string
  location: string
  company: string
  portalUser: boolean
  startDate: string
}

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  /** Version of the currently published onboarding template. */
  templateVersion: string
}

/** In-memory onboarding workflow store — 5 mandatory ordered stages. */
export function useOnboarding({ log, notify, templateVersion }: Deps) {
  const [cases, setCases] = useState<OnboardingCase[]>(seedOnboarding)

  const patch = useCallback(
    (id: string, fn: (c: OnboardingCase) => OnboardingCase) => {
      setCases((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))
    },
    []
  )

  const startOnboarding = useCallback(
    (draft: OnboardingDraft) => {
      const created: OnboardingCase = {
        ...draft,
        id: shortId('onb'),
        templateVersion,
        currentStage: 'Offer Acceptance',
        status: 'in-progress',
        offerAccepted: false,
        documents: STANDARD_DOCS.map(([name, required], i) => ({
          id: `d${i + 1}`,
          name,
          required,
          status: 'missing' as const,
        })),
        assets: STANDARD_ASSETS.map((name, i) => ({
          id: `a${i + 1}`,
          name,
          assigned: false,
        })),
        inductionComplete: false,
      }
      setCases((prev) => [created, ...prev])
      log({
        company: draft.company,
        module: 'Onboarding',
        action: 'Onboarding initiated',
        target: `${created.id} · ${draft.employeeName}`,
        outcome: `5 mandatory stages created from template ${templateVersion}`,
        onBehalfOf: draft.portalUser ? null : draft.employeeName,
      })
      notify({
        recipient: draft.employeeName,
        kind: 'task',
        title: 'Onboarding task: Offer Acceptance',
        body: 'Your onboarding has started. Accept your offer to begin Document Submission.',
      })
      toast.success(`Onboarding initiated for ${draft.employeeName}`)
    },
    [log, notify, templateVersion]
  )

  const acceptOffer = useCallback(
    (c: OnboardingCase, onBehalf: boolean) => {
      patch(c.id, (prev) => ({
        ...prev,
        offerAccepted: true,
        currentStage: 'Document Submission',
      }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: 'Offer accepted',
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Stage advanced to Document Submission',
        onBehalfOf: onBehalf ? c.employeeName : null,
      })
      toast.success('Offer accepted — Document Submission is now open')
    },
    [log, patch]
  )

  const submitDocument = useCallback(
    (c: OnboardingCase, docId: string, onBehalf: boolean) => {
      const doc = c.documents.find((d) => d.id === docId)
      patch(c.id, (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId ? { ...d, status: 'submitted' } : d
        ),
      }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: `Document submitted: ${doc?.name ?? docId}`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Recorded for verification',
        onBehalfOf: onBehalf ? c.employeeName : null,
      })
      toast.success(`${doc?.name ?? 'Document'} uploaded`)
    },
    [log, patch]
  )

  const completeDocumentSubmission = useCallback(
    (c: OnboardingCase) => {
      const missing = c.documents.filter(
        (d) => d.required && (d.status === 'missing' || d.status === 'correction-requested')
      )
      if (missing.length > 0) {
        toast.error(
          `Cannot proceed — ${missing.length} required document(s) still pending: ${missing.map((d) => d.name).join(', ')}`
        )
        return
      }
      patch(c.id, (prev) => ({
        ...prev,
        currentStage: 'Document Verification',
      }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: 'Document Submission completed',
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Stage advanced to Document Verification',
        onBehalfOf: null,
      })
      toast.success('All required documents in — moved to Document Verification')
    },
    [log, patch]
  )

  const reviewDocument = useCallback(
    (c: OnboardingCase, docId: string, verdict: 'verified' | 'correction-requested') => {
      const doc = c.documents.find((d) => d.id === docId)
      patch(c.id, (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId ? { ...d, status: verdict } : d
        ),
      }))
      log({
        company: c.company,
        module: 'Onboarding',
        action:
          verdict === 'verified'
            ? `Document verified: ${doc?.name ?? docId}`
            : `Correction requested: ${doc?.name ?? docId}`,
        target: `${c.id} · ${c.employeeName}`,
        outcome:
          verdict === 'verified'
            ? 'Marked verified'
            : 'Returned to employee for resubmission',
        onBehalfOf: null,
      })
      if (verdict === 'correction-requested') {
        notify({
          recipient: c.employeeName,
          kind: 'task',
          title: `Correction requested: ${doc?.name ?? 'document'}`,
          body: 'Please resubmit the document so verification can continue.',
        })
        toast.info('Correction requested — the document goes back for resubmission')
      } else {
        toast.success('Document verified')
      }
    },
    [log, notify, patch]
  )

  const completeVerification = useCallback(
    (c: OnboardingCase) => {
      const unverified = c.documents.filter(
        (d) => d.required && d.status !== 'verified'
      )
      if (unverified.length > 0) {
        toast.error('All required documents must be verified before this stage completes')
        return
      }
      patch(c.id, (prev) => ({ ...prev, currentStage: 'Asset Assignment' }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: 'Document Verification completed',
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Stage advanced to Asset Assignment',
        onBehalfOf: null,
      })
      toast.success('Verification complete — Asset Assignment is open')
    },
    [log, patch]
  )

  const toggleAsset = useCallback(
    (c: OnboardingCase, assetId: string) => {
      patch(c.id, (prev) => ({
        ...prev,
        assets: prev.assets.map((a) =>
          a.id === assetId ? { ...a, assigned: !a.assigned } : a
        ),
      }))
    },
    [patch]
  )

  const completeAssetAssignment = useCallback(
    (c: OnboardingCase) => {
      if (c.assets.some((a) => !a.assigned)) {
        toast.error('Assign all listed assets before completing this stage')
        return
      }
      patch(c.id, (prev) => ({ ...prev, currentStage: 'Induction Completion' }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: 'Assets assigned',
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Induction Completion is now available',
        onBehalfOf: null,
      })
      toast.success('Assets recorded — Induction Completion is available')
    },
    [log, patch]
  )

  const completeInduction = useCallback(
    (c: OnboardingCase) => {
      const stageIdx = ONBOARDING_STAGES.indexOf(c.currentStage)
      if (stageIdx < ONBOARDING_STAGES.length - 1) {
        toast.error('All prior mandatory stages must complete first')
        return
      }
      patch(c.id, (prev) => ({
        ...prev,
        inductionComplete: true,
        status: 'completed',
      }))
      log({
        company: c.company,
        module: 'Onboarding',
        action: 'Induction completed',
        target: `${c.id} · ${c.employeeName}`,
        outcome: `Onboarding workflow closed on ${todayISO()}`,
        onBehalfOf: null,
      })
      toast.success(`${c.employeeName} is fully onboarded`)
    },
    [log, patch]
  )

  return {
    cases,
    startOnboarding,
    acceptOffer,
    submitDocument,
    completeDocumentSubmission,
    reviewDocument,
    completeVerification,
    toggleAsset,
    completeAssetAssignment,
    completeInduction,
  }
}

export type OnboardingStore = ReturnType<typeof useOnboarding>
