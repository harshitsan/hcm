import { describe, expect, it } from 'vitest'
import {
  countActiveFilters,
  emptyFilterFor,
  isFilterActive,
  matchesFilter,
} from './filters'

describe('emptyFilterFor', () => {
  it('gives a number column a range filter', () => {
    expect(emptyFilterFor('number')).toEqual({
      kind: 'range',
      min: null,
      max: null,
    })
  })

  it('gives an enum column a facet filter', () => {
    expect(emptyFilterFor('enum')).toEqual({ kind: 'facet', selected: [] })
  })

  it('gives a string column a text filter', () => {
    expect(emptyFilterFor('string')).toEqual({ kind: 'text', query: '' })
  })
})

describe('isFilterActive', () => {
  it('is false for an empty range', () => {
    expect(isFilterActive({ kind: 'range', min: null, max: null })).toBe(false)
  })

  it('is true when only a min is set', () => {
    expect(isFilterActive({ kind: 'range', min: 10, max: null })).toBe(true)
  })

  it('is false for a whitespace-only text query', () => {
    expect(isFilterActive({ kind: 'text', query: '   ' })).toBe(false)
  })
})

describe('matchesFilter', () => {
  it('range filter excludes rows outside the bounds', () => {
    const f = { kind: 'range', min: 100, max: 500 } as const
    expect(matchesFilter(250, f)).toBe(true)
    expect(matchesFilter(50, f)).toBe(false)
    expect(matchesFilter(900, f)).toBe(false)
  })

  it('range filter with only a min excludes rows below it', () => {
    const f = { kind: 'range', min: 100, max: null } as const
    expect(matchesFilter(900, f)).toBe(true)
    expect(matchesFilter(50, f)).toBe(false)
  })

  it('facet filter matches any selected value', () => {
    const f = { kind: 'facet', selected: ['India', 'US'] } as const
    expect(matchesFilter('India', f)).toBe(true)
    expect(matchesFilter('UK', f)).toBe(false)
  })

  it('text filter matches case-insensitive substrings', () => {
    const f = { kind: 'text', query: 'acme' } as const
    expect(matchesFilter('ACME Holdings', f)).toBe(true)
    expect(matchesFilter('Globex', f)).toBe(false)
  })

  it('an inactive filter matches everything', () => {
    expect(matchesFilter(null, { kind: 'text', query: '' })).toBe(true)
  })
})

describe('countActiveFilters', () => {
  it('counts only the active ones', () => {
    const n = countActiveFilters({
      a: { kind: 'text', query: 'x' },
      b: { kind: 'range', min: null, max: null },
      c: { kind: 'facet', selected: ['India'] },
    })
    expect(n).toBe(2)
  })
})
