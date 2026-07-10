import { useCallback, useState } from 'react'
import { PIPELINE_STAGES } from '../data/candidates'
import {
  seedDocumentSubmissions,
  type DocumentSubmission,
} from '../data/candidate-documents'

/** Required-document shape needed for gap checks (subset of config's
 * RequiredDocument so callers can pass the full seed rows directly). */
export interface RequiredDocInput {
  id: string
  name: string
  docType: string
  requiredAtStage: string
}

const stageIndex = (stage: string) => {
  const i = (PIPELINE_STAGES as readonly string[]).indexOf(stage)
  return i === -1 ? PIPELINE_STAGES.length : i
}

/**
 * Candidate document-submission store — tracks the four fulfilment modes
 * (submit now / submit later / physical copy / not needed) per required
 * document and computes the gaps that block offer-letter generation
 * (Kensium PDF — Hiring → Offer Letter, TA-54).
 */
export function useCandidateDocuments() {
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>(
    seedDocumentSubmissions
  )

  /** Create or replace the submission for (applicationId, docName). */
  const upsert = useCallback(
    (input: Omit<DocumentSubmission, 'id'> & { id?: string }) => {
      setSubmissions((prev) => {
        const existing = prev.find(
          (s) =>
            s.applicationId === input.applicationId &&
            s.docName === input.docName
        )
        if (existing) {
          return prev.map((s) =>
            s.id === existing.id ? { ...s, ...input, id: existing.id } : s
          )
        }
        return [
          ...prev,
          { ...input, id: `sub-${Date.now()}-${prev.length}` },
        ]
      })
    },
    []
  )

  const submissionsFor = useCallback(
    (applicationId: string) =>
      submissions.filter((s) => s.applicationId === applicationId),
    [submissions]
  )

  /**
   * Required documents due at or before the given stage that are still
   * outstanding — no submission at all, or only a "submit later" promise.
   * Physical copies and not-needed waivers count as fulfilled.
   */
  const missingRequiredFor = useCallback(
    (
      applicationId: string,
      requiredDocs: RequiredDocInput[],
      stage: string
    ): RequiredDocInput[] => {
      const cutoff = stageIndex(stage)
      return requiredDocs.filter((doc) => {
        if (stageIndex(doc.requiredAtStage) > cutoff) return false
        const sub = submissions.find(
          (s) => s.applicationId === applicationId && s.docName === doc.name
        )
        return !sub || sub.status === 'submit-later'
      })
    },
    [submissions]
  )

  return { submissions, upsert, submissionsFor, missingRequiredFor }
}

export type CandidateDocumentsStore = ReturnType<typeof useCandidateDocuments>
