import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Formats conversion feature argument text by removing markdown formatting
 * and converting newlines to line breaks
 * @param text - The text to format
 * @returns Formatted text with markdown removed and newlines preserved
 */
export function formatConversionFeatureArgument(
  text: string | null | undefined
): string {
  if (!text) return ''

  return (
    text
      // Remove markdown headers (#, ##, ###, ####, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold markers (**text**)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove single asterisks used for emphasis (*text*)
      .replace(/\*(.*?)\*/g, '$1')
      // Preserve newlines (they will be handled by CSS white-space: pre-wrap or <br />)
      .trim()
  )
}
