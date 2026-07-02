export function formatDuration(seconds: string | number): string {
  const totalSeconds =
    typeof seconds === 'string' ? parseInt(seconds, 10) : seconds
  if (isNaN(totalSeconds) || totalSeconds === 0) return '0s'

  const minutes = Math.floor(totalSeconds / 60)
  const secs = (totalSeconds % 60).toFixed(0)

  if (minutes === 0) return `${secs}s`
  if (Number(secs) === 0) return `${minutes}m`
  return `${minutes}m ${secs}s`
}

export function formatTotalDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds === 0) return '0s'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = Math.floor(totalSeconds % 60)

  if (hours > 0) {
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  if (minutes === 0) return `${secs}s`
  if (secs === 0) return `${minutes}m`
  return `${minutes}m ${secs}s`
}

export function formatDurationWithUnit(seconds: number): {
  value: number
  unit: 'h' | 'm' | 's'
} {
  if (!seconds || seconds === 0) {
    return { value: 0, unit: 's' }
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return { value: hours, unit: 'h' }
  } else if (minutes > 0) {
    return { value: minutes, unit: 'm' }
  } else {
    return { value: secs, unit: 's' }
  }
}
