import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCostApprovers,
  seedExternalTrainers,
  seedLearningSetup,
  seedQuestionnaire,
  seedTrainingTopics,
  type ExternalTrainer,
  type LearningSetup,
  type QuestionnaireQuestion,
  type TrainingCostApprover,
  type TrainingTopic,
} from '../data/learning-admin'

export type QuestionDraft = Omit<QuestionnaireQuestion, 'id'>
export type TrainerDraft = Omit<ExternalTrainer, 'id'>
export type CostApproverDraft = Omit<TrainingCostApprover, 'id'>
export type TrainingTopicDraft = Omit<TrainingTopic, 'id'>

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/**
 * In-memory learning-management configuration store: module setup (SET-01/02),
 * certification questionnaire (CQ-01..03), external trainers (MET-01..04),
 * training cost approvers (TCA-01..04) and training topics (TT-01..05).
 */
export function useLearningAdmin() {
  const [setup, setSetup] = useState<LearningSetup>(seedLearningSetup)
  const [questions, setQuestions] =
    useState<QuestionnaireQuestion[]>(seedQuestionnaire)
  const [trainers, setTrainers] =
    useState<ExternalTrainer[]>(seedExternalTrainers)
  const [costApprovers, setCostApprovers] =
    useState<TrainingCostApprover[]>(seedCostApprovers)
  const [topics, setTopics] = useState<TrainingTopic[]>(seedTrainingTopics)

  /** Persists the setup step in one action (SET-01/02). */
  const saveSetup = useCallback((next: LearningSetup) => {
    setSetup(next)
    toast.success(
      next.moduleEnabled
        ? 'Learning management setup saved — module enabled'
        : 'Learning management setup saved — module disabled'
    )
  }, [])

  const addQuestion = useCallback((draft: QuestionDraft) => {
    setQuestions((prev) => [{ ...draft, id: newId('qq') }, ...prev])
    toast.success(`${draft.section} question added to the questionnaire`)
  }, [])

  const updateQuestion = useCallback((id: string, draft: QuestionDraft) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...draft } : q))
    )
    toast.success('Questionnaire question updated')
  }, [])

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success('Question removed from the questionnaire')
  }, [])

  /** Simulated re-fetch of both questionnaire lists (CQ-03). */
  const refreshQuestions = useCallback(() => {
    setQuestions((prev) => [...prev])
    toast.success('Questionnaire refreshed — showing the latest questions')
  }, [])

  const addTrainer = useCallback((draft: TrainerDraft) => {
    setTrainers((prev) => [{ ...draft, id: newId('et') }, ...prev])
    toast.success(`External trainer "${draft.name}" added`)
  }, [])

  const updateTrainer = useCallback((id: string, draft: TrainerDraft) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
    )
    toast.success('External trainer updated')
  }, [])

  const removeTrainer = useCallback((id: string) => {
    setTrainers((prev) => prev.filter((t) => t.id !== id))
    toast.success('External trainer removed')
  }, [])

  /** Simulated re-fetch of the trainer list (MET-04). */
  const refreshTrainers = useCallback(() => {
    setTrainers((prev) => [...prev])
    toast.success('External trainers refreshed — showing the latest records')
  }, [])

  const addCostApprover = useCallback((draft: CostApproverDraft) => {
    setCostApprovers((prev) => [{ ...draft, id: newId('tca') }, ...prev])
    toast.success('Training cost approver rule added')
  }, [])

  const updateCostApprover = useCallback(
    (id: string, draft: CostApproverDraft) => {
      setCostApprovers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
      )
      toast.success('Training cost approver rule updated')
    },
    []
  )

  const removeCostApprover = useCallback((id: string) => {
    setCostApprovers((prev) => prev.filter((c) => c.id !== id))
    toast.success('Training cost approver rule removed')
  }, [])

  /** Simulated re-fetch of the approver rules (TCA-04). */
  const refreshCostApprovers = useCallback(() => {
    setCostApprovers((prev) => [...prev])
    toast.success('Cost approvers refreshed — showing the latest rules')
  }, [])

  const addTopic = useCallback((draft: TrainingTopicDraft) => {
    setTopics((prev) => [{ ...draft, id: newId('tt') }, ...prev])
    toast.success(`Training topic "${draft.name}" added`)
  }, [])

  const updateTopic = useCallback((id: string, draft: TrainingTopicDraft) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...draft } : t)))
    toast.success('Training topic updated')
  }, [])

  const removeTopic = useCallback((id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id))
    toast.success('Training topic removed')
  }, [])

  /** Simulated re-fetch of the topics list (TT-05). */
  const refreshTopics = useCallback(() => {
    setTopics((prev) => [...prev])
    toast.success('Training topics refreshed — showing the latest topics')
  }, [])

  return {
    setup,
    saveSetup,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    refreshQuestions,
    trainers,
    addTrainer,
    updateTrainer,
    removeTrainer,
    refreshTrainers,
    costApprovers,
    addCostApprover,
    updateCostApprover,
    removeCostApprover,
    refreshCostApprovers,
    topics,
    addTopic,
    updateTopic,
    removeTopic,
    refreshTopics,
  }
}

export type LearningAdminStore = ReturnType<typeof useLearningAdmin>
