/**
 * Interview assessment questions & rating sets (Kensium PDF —
 * Configuration → Interview Assessment Questions). Interviewers answer
 * these on the interview assessment form; each question can optionally
 * require a free-text response and/or a rating from a configured set.
 */

export interface RatingOption {
  value: number
  label: string
  displayOrder: number
}

export interface RatingSet {
  id: string
  name: string
  options: RatingOption[]
}

export interface AssessmentQuestion {
  id: string
  question: string
  /** Interviewer must enter a free-text response. */
  responseRequired: boolean
  /** Interviewer must pick a rating from the linked rating set. */
  ratingRequired: boolean
  ratingSetId: string | null
  /** 'all' or the specific position titles the question applies to. */
  applicablePositions: 'all' | string[]
  displayOrder: number
  active: boolean
}

export const seedRatingSets: RatingSet[] = [
  {
    id: 'rs-1',
    name: '5-point competency scale',
    options: [
      { value: 1, label: 'Poor', displayOrder: 1 },
      { value: 2, label: 'Below expectations', displayOrder: 2 },
      { value: 3, label: 'Meets expectations', displayOrder: 3 },
      { value: 4, label: 'Exceeds expectations', displayOrder: 4 },
      { value: 5, label: 'Outstanding', displayOrder: 5 },
    ],
  },
  {
    id: 'rs-2',
    name: 'Yes / No / Partial',
    options: [
      { value: 1, label: 'No', displayOrder: 1 },
      { value: 2, label: 'Partial', displayOrder: 2 },
      { value: 3, label: 'Yes', displayOrder: 3 },
    ],
  },
]

export const seedAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'aq-1',
    question:
      'How well does the candidate demonstrate the core technical skills required for this role?',
    responseRequired: true,
    ratingRequired: true,
    ratingSetId: 'rs-1',
    applicablePositions: 'all',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'aq-2',
    question:
      'Rate the candidate on communication and the ability to explain their reasoning.',
    responseRequired: false,
    ratingRequired: true,
    ratingSetId: 'rs-1',
    applicablePositions: 'all',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'aq-3',
    question:
      'Did the candidate design a workable solution for the system-design exercise?',
    responseRequired: true,
    ratingRequired: true,
    ratingSetId: 'rs-2',
    applicablePositions: ['Senior Backend Engineer', 'Staff Engineer'],
    displayOrder: 3,
    active: true,
  },
  {
    id: 'aq-4',
    question:
      'Summarise overall strengths, concerns and any follow-ups for the next round.',
    responseRequired: true,
    ratingRequired: false,
    ratingSetId: null,
    applicablePositions: 'all',
    displayOrder: 4,
    active: true,
  },
]
