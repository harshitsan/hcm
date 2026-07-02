export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}

export function getDeterministicColor(seed: string | null | undefined): string {
  const palette = [
    '#2563EB',
    '#DB2777',
    '#059669',
    '#D97706',
    '#7C3AED',
    '#0EA5E9',
    '#F43F5E',
    '#10B981',
    '#F59E0B',
    '#6366F1',
  ]
  if (!seed) return palette[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % palette.length
  return palette[idx]
}

export function lightenHex(hex: string, amount: number): string {
  // amount: 0..1, where 1 is white
  const parsed = hex.replace('#', '')
  const r = parseInt(parsed.substring(0, 2), 16)
  const g = parseInt(parsed.substring(2, 4), 16)
  const b = parseInt(parsed.substring(4, 6), 16)

  const lighten = (c: number) => Math.round(c + (255 - c) * amount)
  const rl = lighten(r)
  const gl = lighten(g)
  const bl = lighten(b)

  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(rl)}${toHex(gl)}${toHex(bl)}`
}

export function applyColorsToElements(
  className: string,
  colors: string[],
  delay: number = 0
) {
  const applyColors = () => {
    const elements = document.querySelectorAll(className)
    elements.forEach((element, index) => {
      const colorIndex = index % colors.length
      const backgroundColor = colors[colorIndex]
      ;(element as HTMLElement).style.backgroundColor = backgroundColor
    })
  }

  if (delay > 0) {
    setTimeout(applyColors, delay)
  } else {
    applyColors()
  }
}

export function toTitleCase(str: string | null | undefined) {
  if (str == null) return ''
  const s = typeof str === 'string' ? str : String(str)
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter((word) => word.trim().length)
    .map((word: string) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
