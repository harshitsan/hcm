import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCertifications,
  seedLearningRequests,
  seedTrainingPrograms,
  type LearningRequest,
} from '../data/learning'

export type LearningRequestDraft = Pick<
  LearningRequest,
  'program' | 'learningType' | 'sponsorship'
>

/** In-memory learning store: requests, programs, certifications (ESS-29/30). */
export function useLearning() {
  const [requests, setRequests] =
    useState<LearningRequest[]>(seedLearningRequests)
  const [programs] = useState(seedTrainingPrograms)
  const [certifications] = useState(seedCertifications)

  const raiseRequest = useCallback((draft: LearningRequestDraft) => {
    setRequests((prev) => [
      {
        ...draft,
        id: `lr-${crypto.randomUUID().slice(0, 8)}`,
        result: '—',
        status: 'Requested',
        raisedOn: new Date().toISOString().slice(0, 10),
        task: null,
      },
      ...prev,
    ])
    toast.success(`Learning request for "${draft.program}" raised`)
  }, [])

  const cancelRequest = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r))
    )
    toast.success('Learning request cancelled')
  }, [])

  /** Completes the pending task on a request row (ESS-39). */
  const completeTask = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, task: null, result: 'Completed — certificate on file' } : r
      )
    )
    toast.success('Task completed — the pending indicator is cleared')
  }, [])

  return { requests, programs, certifications, raiseRequest, cancelRequest, completeTask }
}

export type LearningStore = ReturnType<typeof useLearning>
