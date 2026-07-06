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
  const [programs, setPrograms] = useState(seedTrainingPrograms)
  const [certifications, setCertifications] = useState(seedCertifications)

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

  /** Completes the pending task on a training program card (TP-06). */
  const completeProgramTask = useCallback((id: string) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const confirming = p.task === 'Confirm participation'
        return {
          ...p,
          task: null,
          status: confirming ? 'Confirmed' : p.status,
        }
      })
    )
    toast.success('Training program task completed')
  }, [])

  /** Simulated re-fetch of certification records (CERT-04). */
  const refreshCertifications = useCallback(() => {
    setCertifications((prev) => [...prev])
    toast.success('Certifications refreshed — showing the latest records')
  }, [])

  return {
    requests,
    programs,
    certifications,
    raiseRequest,
    cancelRequest,
    completeTask,
    completeProgramTask,
    refreshCertifications,
  }
}

export type LearningStore = ReturnType<typeof useLearning>
