import { describe, expect, it } from 'vitest'
import { comparatorFor } from './spec'

describe('comparatorFor', () => {
  it('sorts strings A to Z, case-insensitively', () => {
    const cmp = comparatorFor('string')
    expect(['banana', 'Apple', 'cherry'].sort(cmp)).toEqual([
      'Apple',
      'banana',
      'cherry',
    ])
  })

  it('sorts numbers ascending', () => {
    const cmp = comparatorFor('number')
    expect([100, 5, 20].sort(cmp)).toEqual([5, 20, 100])
  })

  it('does not sort numbers lexicographically', () => {
    const cmp = comparatorFor('number')
    expect([100, 5, 20].sort(cmp)).not.toEqual([100, 20, 5])
  })

  it('sorts dates oldest first', () => {
    const cmp = comparatorFor('date')
    const a = new Date('2026-01-01')
    const b = new Date('2025-01-01')
    expect([a, b].sort(cmp)).toEqual([b, a])
  })

  it('sorts nulls last regardless of type', () => {
    const cmp = comparatorFor('number')
    expect([null, 3, null, 1].sort(cmp)).toEqual([1, 3, null, null])
  })
})
