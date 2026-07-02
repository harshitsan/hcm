/**
 * Parse markdown conversation summary into structured data
 */
export function parseConversationSummary(summary: string | null): {
  summaryText: string
  highlights: Array<{ label: string; description: string }>
  riskFactors: Array<{
    label: string
    description: string
    labelClassName?: string
  }>
} {
  if (!summary) {
    return { summaryText: '', highlights: [], riskFactors: [] }
  }

  const highlights: Array<{ label: string; description: string }> = []
  const riskFactors: Array<{
    label: string
    description: string
    labelClassName?: string
  }> = []

  // Extract Summary section
  const summaryMatch = summary.match(
    /^### Summary\n([\s\S]*?)(?=### Highlights|$)/
  )
  const summaryText = summaryMatch ? summaryMatch[1].trim() : ''

  // Extract Highlights section
  const highlightsMatch = summary.match(
    /### Highlights\n([\s\S]*?)(?=### Risk Factors|$)/
  )
  if (highlightsMatch) {
    const highlightsText = highlightsMatch[1]
    // Match bullet points like "- **Label:** Description"
    // Handles multi-line descriptions
    const highlightLines = highlightsText.split(/\n(?=- )/)
    for (const line of highlightLines) {
      const match = line.match(/^- \*\*(.+?):\*\* (.+?)$/s)
      if (match) {
        highlights.push({
          label: match[1].trim(),
          description: match[2].trim().replace(/\n+/g, ' '),
        })
      }
    }
  }

  // Extract Risk Factors section
  const riskFactorsMatch = summary.match(/### Risk Factors\n([\s\S]*?)$/s)
  if (riskFactorsMatch) {
    const riskFactorsText = riskFactorsMatch[1]
    // Match numbered items like "1. **Label:** Description"
    // Handles multi-line descriptions
    const riskFactorLines = riskFactorsText.split(/\n(?=\d+\. )/)
    for (const line of riskFactorLines) {
      const match = line.match(/^\d+\. \*\*(.+?):\*\* (.+?)$/s)
      if (match) {
        riskFactors.push({
          label: match[1].trim(),
          description: match[2].trim().replace(/\n+/g, ' '),
          labelClassName: 'font-semibold',
        })
      }
    }
  }

  return { summaryText, highlights, riskFactors }
}
