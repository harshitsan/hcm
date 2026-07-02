export function parseSurveyResponse(
  surveyResponse: string | null
): string | number {
  if (!surveyResponse) return '-'
  const parsed = parseInt(surveyResponse, 10)
  return isNaN(parsed) ? '-' : parsed
}

export function parseInactivityDays(
  inactivityValue: string | null | undefined
): number | null {
  if (!inactivityValue || inactivityValue === 'custom') {
    return null
  }

  // Extract number from strings like "3-days", "5-days", etc.
  const match = inactivityValue.match(/^(\d+)-days?$/)
  if (match) {
    return parseInt(match[1], 10)
  }

  return null
}
