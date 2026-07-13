import { useCallback, useEffect, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { initialVisibility } from './build-columns'
import type { TableSpec } from './spec'

const key = (id: string) => `shr-cols-${id}`

export function useColumnVisibility<T>(spec: TableSpec<T>) {
  const defaults = initialVisibility(spec)

  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem(key(spec.id))
    if (!saved) return defaults
    try {
      // Merge so that columns added to the spec since the value was saved
      // still appear, rather than silently vanishing.
      return { ...defaults, ...(JSON.parse(saved) as VisibilityState) }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(key(spec.id), JSON.stringify(visibility))
  }, [spec.id, visibility])

  const resetVisibility = useCallback(() => {
    setVisibility(initialVisibility(spec))
  }, [spec])

  return { visibility, setVisibility, resetVisibility }
}
