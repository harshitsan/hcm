import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAssessmentQuestions,
  seedRatingSets,
  type AssessmentQuestion,
  type RatingSet,
} from '../data/assessment'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 6)}`
}

/**
 * In-memory store for interview assessment questions & rating sets
 * (Kensium PDF — Configuration → Interview Assessment Questions).
 */
export function useAssessment() {
  const [ratingSets, setRatingSets] = useState<RatingSet[]>(seedRatingSets)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    seedAssessmentQuestions
  )

  const addRatingSet = useCallback((draft: Omit<RatingSet, 'id'>) => {
    setRatingSets((prev) => [...prev, { ...draft, id: newId('rs') }])
    toast.success(`Rating set "${draft.name}" saved`)
  }, [])

  const updateRatingSet = useCallback(
    (id: string, patch: Partial<Omit<RatingSet, 'id'>>) => {
      setRatingSets((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success(
        'Rating set updated — subsequent assessments show the new options'
      )
    },
    []
  )

  const addQuestion = useCallback(
    (draft: Omit<AssessmentQuestion, 'id' | 'displayOrder'>) => {
      setQuestions((prev) => [
        ...prev,
        {
          ...draft,
          id: newId('aq'),
          displayOrder:
            prev.reduce((max, q) => Math.max(max, q.displayOrder), 0) + 1,
        },
      ])
      toast.success('Assessment question added')
    },
    []
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<Omit<AssessmentQuestion, 'id'>>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
      )
      toast.success('Assessment question updated')
    },
    []
  )

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success(
      'Assessment question removed — submitted assessments keep their answers'
    )
  }, [])

  /** Swap displayOrder with the previous/next question in display order. */
  const moveQuestion = useCallback((id: string, dir: 'up' | 'down') => {
    setQuestions((prev) => {
      const sorted = [...prev].sort((a, b) => a.displayOrder - b.displayOrder)
      const idx = sorted.findIndex((q) => q.id === id)
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return prev
      const a = sorted[idx]
      const b = sorted[swapIdx]
      return prev.map((q) =>
        q.id === a.id
          ? { ...q, displayOrder: b.displayOrder }
          : q.id === b.id
            ? { ...q, displayOrder: a.displayOrder }
            : q
      )
    })
  }, [])

  return {
    ratingSets,
    addRatingSet,
    updateRatingSet,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    moveQuestion,
  }
}

export type AssessmentStore = ReturnType<typeof useAssessment>
