import { describe, expect, it } from 'vitest'
import { applyPrimaryFirst } from './build-columns'
import type { TableSpec } from './spec'

interface J {
  name: string
  isPrimary: boolean
}

const spec: TableSpec<J> = {
  id: 'jurisdictions',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name },
  ],
  primaryFirst: (r) => r.isPrimary,
}

describe('applyPrimaryFirst', () => {
  it('lifts the primary row to the top', () => {
    const rows: J[] = [
      { name: 'Karnataka', isPrimary: false },
      { name: 'Maharashtra', isPrimary: true },
      { name: 'Delhi', isPrimary: false },
    ]
    expect(applyPrimaryFirst(rows, spec).map((r) => r.name)).toEqual([
      'Maharashtra',
      'Karnataka',
      'Delhi',
    ])
  })

  it('is stable — preserves the incoming sort within each group', () => {
    const rows: J[] = [
      { name: 'Alpha', isPrimary: false },
      { name: 'Beta', isPrimary: false },
      { name: 'Zulu', isPrimary: true },
    ]
    expect(applyPrimaryFirst(rows, spec).map((r) => r.name)).toEqual([
      'Zulu',
      'Alpha',
      'Beta',
    ])
  })

  it('is a no-op when the spec declares no primaryFirst', () => {
    const noPrimary: TableSpec<J> = { ...spec, primaryFirst: undefined }
    const rows: J[] = [
      { name: 'A', isPrimary: false },
      { name: 'B', isPrimary: true },
    ]
    expect(applyPrimaryFirst(rows, noPrimary).map((r) => r.name)).toEqual(['A', 'B'])
  })
})
