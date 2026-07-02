/**
 * Highlights matching text in a string
 * @param text - The text to highlight
 * @param searchTerm - The search term to highlight
 * @returns Array of text parts with highlight information
 */
export function highlightText(
  text: string,
  searchTerm: string
): Array<{ text: string; highlight: boolean }> {
  if (!searchTerm.trim() || !text) {
    return [{ text: String(text), highlight: false }]
  }

  const searchLower = searchTerm.toLowerCase()
  const textLower = text.toLowerCase()
  const parts: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0
  let index = textLower.indexOf(searchLower, lastIndex)

  while (index !== -1) {
    // Add non-highlighted part before match
    if (index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, index),
        highlight: false,
      })
    }

    // Add highlighted match
    parts.push({
      text: text.substring(index, index + searchTerm.length),
      highlight: true,
    })

    lastIndex = index + searchTerm.length
    index = textLower.indexOf(searchLower, lastIndex)
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      highlight: false,
    })
  }

  return parts.length > 0 ? parts : [{ text: String(text), highlight: false }]
}
