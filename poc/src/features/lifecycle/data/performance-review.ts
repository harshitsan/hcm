/**
 * Performance Review — review-cycle initiations tracked by managers and the
 * per-employee ratings submitted against each review period.
 */

export const INITIATION_STATUSES = [
  'Initiated',
  'Pending Initiation',
  'Completed',
] as const

export type InitiationStatus = (typeof INITIATION_STATUSES)[number]

export interface ReviewInitiation {
  id: string
  reviewPeriodFrom: string
  reviewPeriodTo: string
  status: InitiationStatus
  /** Next task for the manager in this cycle. */
  task: string
}

export const seedInitiations: ReviewInitiation[] = [
  {
    id: 'pri-01',
    reviewPeriodFrom: '2026-01-01',
    reviewPeriodTo: '2026-03-31',
    status: 'Completed',
    task: 'Cycle closed — ratings published',
  },
  {
    id: 'pri-02',
    reviewPeriodFrom: '2026-04-01',
    reviewPeriodTo: '2026-06-30',
    status: 'Initiated',
    task: 'Collect self-assessments',
  },
  {
    id: 'pri-03',
    reviewPeriodFrom: '2026-07-01',
    reviewPeriodTo: '2026-09-30',
    status: 'Pending Initiation',
    task: 'Initiate review for 12 employees',
  },
  {
    id: 'pri-04',
    reviewPeriodFrom: '2025-10-01',
    reviewPeriodTo: '2025-12-31',
    status: 'Completed',
    task: 'Cycle closed — ratings published',
  },
]

export const RATING_STATUSES = ['Pending Submission', 'Closed'] as const

export type RatingStatus = (typeof RATING_STATUSES)[number]

export interface ReviewRating {
  id: string
  employeeName: string
  reviewPeriodFrom: string
  reviewPeriodTo: string
  status: RatingStatus
  /** Outstanding task against this rating record. */
  task: string
  rating: number | null
}

export const seedRatings: ReviewRating[] = [
  {
    id: 'eprr-01',
    employeeName: 'Kavya Menon',
    reviewPeriodFrom: '2026-04-01',
    reviewPeriodTo: '2026-06-30',
    status: 'Pending Submission',
    task: 'Submit manager rating',
    rating: null,
  },
  {
    id: 'eprr-02',
    employeeName: 'Arjun Rao',
    reviewPeriodFrom: '2026-04-01',
    reviewPeriodTo: '2026-06-30',
    status: 'Pending Submission',
    task: 'Submit manager rating',
    rating: null,
  },
  {
    id: 'eprr-03',
    employeeName: 'Harold Kim',
    reviewPeriodFrom: '2026-01-01',
    reviewPeriodTo: '2026-03-31',
    status: 'Closed',
    task: 'None — rating published',
    rating: 4,
  },
  {
    id: 'eprr-04',
    employeeName: 'Meghna Iyer',
    reviewPeriodFrom: '2026-01-01',
    reviewPeriodTo: '2026-03-31',
    status: 'Closed',
    task: 'None — rating published',
    rating: 5,
  },
  {
    id: 'eprr-05',
    employeeName: 'Peter Novak',
    reviewPeriodFrom: '2025-10-01',
    reviewPeriodTo: '2025-12-31',
    status: 'Closed',
    task: 'None — rating published',
    rating: 3,
  },
]
