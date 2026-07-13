import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { TableSpec } from './spec'
import { useColumnVisibility } from './use-table-state'

interface R { a: string; b: string }

const spec: TableSpec<R> = {
  id: 'demo',
  columns: [
    { id: 'a', header: 'A', type: 'string', accessor: (r) => r.a, required: true },
    { id: 'b', header: 'B', type: 'string', accessor: (r) => r.b, default: 'hidden' },
  ],
}

describe('useColumnVisibility', () => {
  beforeEach(() => localStorage.clear())

  it('seeds from the spec defaults', () => {
    const { result } = renderHook(() => useColumnVisibility(spec))
    expect(result.current.visibility).toEqual({ a: true, b: false })
  })

  it('persists a change to localStorage', () => {
    const { result } = renderHook(() => useColumnVisibility(spec))
    act(() => result.current.setVisibility({ a: true, b: true }))
    expect(JSON.parse(localStorage.getItem('shr-cols-demo')!)).toEqual({
      a: true,
      b: true,
    })
  })

  it('rehydrates a persisted value on mount', () => {
    localStorage.setItem('shr-cols-demo', JSON.stringify({ a: true, b: true }))
    const { result } = renderHook(() => useColumnVisibility(spec))
    expect(result.current.visibility.b).toBe(true)
  })

  it('resets back to the spec defaults', () => {
    localStorage.setItem('shr-cols-demo', JSON.stringify({ a: true, b: true }))
    const { result } = renderHook(() => useColumnVisibility(spec))
    act(() => result.current.resetVisibility())
    expect(result.current.visibility).toEqual({ a: true, b: false })
  })
})
