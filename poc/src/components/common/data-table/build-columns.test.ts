import { describe, expect, it } from 'vitest'
import {
  buildColumns,
  detailColumns,
  facetOptionsFor,
  initialVisibility,
} from './build-columns'
import type { TableSpec } from './spec'

interface Co {
  name: string
  employees: number
  region: string
  tier: string
}

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India', tier: 'Basic' },
  { name: 'Globex', employees: 20, region: 'US', tier: 'Enterprise' },
  { name: 'Initech', employees: 900, region: 'India', tier: 'Basic' },
]

const spec: TableSpec<Co> = {
  id: 'test-companies',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
    { id: 'tier', header: 'Tier', type: 'enum', accessor: (r) => r.tier, default: 'hidden', detail: true },
  ],
}

describe('buildColumns', () => {
  it('excludes detail columns from the grid', () => {
    const ids = buildColumns(spec).map((c) => c.id)
    expect(ids).toEqual(['name', 'employees', 'region'])
    expect(ids).not.toContain('tier')
  })

  it('marks required columns as non-hideable', () => {
    const name = buildColumns(spec).find((c) => c.id === 'name')
    expect(name?.enableHiding).toBe(false)
  })

  it('attaches a filterFn that actually excludes rows', () => {
    const employees = buildColumns(spec).find((c) => c.id === 'employees')
    const fn = employees?.filterFn as unknown as (
      row: { getValue: (id: string) => unknown },
      id: string,
      value: unknown
    ) => boolean
    const row = { getValue: () => 20 }
    expect(fn(row, 'employees', { kind: 'range', min: 100, max: null })).toBe(false)
    expect(fn(row, 'employees', { kind: 'range', min: 10, max: null })).toBe(true)
  })
})

describe('detailColumns', () => {
  it('returns only the detail-flagged columns', () => {
    expect(detailColumns(spec).map((c) => c.id)).toEqual(['tier'])
  })
})

describe('initialVisibility', () => {
  it('hides columns marked default hidden and shows the rest', () => {
    expect(initialVisibility(spec)).toEqual({
      name: true,
      employees: true,
      region: true,
      tier: false,
    })
  })
})

describe('facetOptionsFor', () => {
  it('returns the sorted unique values present in the data', () => {
    expect(facetOptionsFor(spec, rows, 'region')).toEqual(['India', 'US'])
  })
})
