/**
 * Reference-check questionnaire (Kensium PDF — Configuration → Reference
 * Check). Questions are subjective (free text) or objective (radio /
 * checkbox with configured options), and apply to all positions or a
 * specific set. The hiring-side reference-check form renders these.
 */

export const REF_QUESTION_TYPES = ['Subjective', 'Objective'] as const
export type RefQuestionType = (typeof REF_QUESTION_TYPES)[number]

export const REF_FIELD_TYPES = ['Radio', 'Checkbox'] as const
export type RefFieldType = (typeof REF_FIELD_TYPES)[number]

export interface ReferenceQuestion {
  id: string
  question: string
  questionType: RefQuestionType
  /** Only for objective questions; subjective questions are free text. */
  fieldType: RefFieldType | null
  options: string[]
  /** 'all' or a list of position titles the question applies to. */
  applicablePositions: 'all' | string[]
  displayOrder: number
  active: boolean
}

export const seedReferenceQuestions: ReferenceQuestion[] = [
  {
    id: 'refq-1',
    question: 'How long have you known the candidate, and in what capacity?',
    questionType: 'Subjective',
    fieldType: null,
    options: [],
    applicablePositions: 'all',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'refq-2',
    question: 'Would you rehire this candidate?',
    questionType: 'Objective',
    fieldType: 'Radio',
    options: ['Yes', 'No', 'With reservations'],
    applicablePositions: 'all',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'refq-3',
    question: 'Which of the following strengths did the candidate demonstrate?',
    questionType: 'Objective',
    fieldType: 'Checkbox',
    options: ['Technical depth', 'Ownership', 'Communication', 'Leadership', 'Mentoring'],
    applicablePositions: 'all',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'refq-4',
    question: 'Rate the candidate’s ability to lead delivery under pressure.',
    questionType: 'Objective',
    fieldType: 'Radio',
    options: ['Outstanding', 'Good', 'Average', 'Below average'],
    applicablePositions: ['Senior Backend Engineer', 'Data Engineer'],
    displayOrder: 4,
    active: true,
  },
  {
    id: 'refq-5',
    question: 'Describe the candidate’s key achievements in your organisation.',
    questionType: 'Subjective',
    fieldType: null,
    options: [],
    applicablePositions: 'all',
    displayOrder: 5,
    active: true,
  },
]

/** Answer captured against one questionnaire question. */
export interface ReferenceAnswer {
  questionId: string
  question: string
  /** Free text for subjective / radio choice; joined choices for checkbox. */
  answer: string
}
