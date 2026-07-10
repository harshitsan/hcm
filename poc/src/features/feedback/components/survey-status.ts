import { type SurveyStatus } from '../data/surveys'

/** Shared badge styling for survey lifecycle states (Survey List & detail). */
export function surveyStatusVariant(
  status: SurveyStatus
): 'badge_inactive' | 'pending' | 'open' | 'completed' {
  switch (status) {
    case 'Draft':
      return 'badge_inactive'
    case 'Pending Approval':
      return 'pending'
    case 'Published':
      return 'open'
    case 'Completed':
      return 'completed'
  }
}
