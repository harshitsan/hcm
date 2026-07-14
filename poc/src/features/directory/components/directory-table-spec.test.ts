import { describe, expect, it } from 'vitest'
import { directoryTableSpec } from './directory-table-spec'

describe('directoryTableSpec', () => {
  const spec = directoryTableSpec({ showCompany: true })

  const col = (id: string) => spec.columns.find((c) => c.id === id)

  it('marks name as required', () => {
    expect(col('name')?.required).toBe(true)
  })

  it('never sets a filter property — filtering is external (applyFilters)', () => {
    expect(spec.columns.every((c) => c.filter === undefined)).toBe(true)
  })

  it('includes employeeCode and workGroup as detail-tier columns', () => {
    const detailIds = spec.columns
      .filter((c) => c.detail === true)
      .map((c) => c.id)
    expect(detailIds).toContain('employeeCode')
    expect(detailIds).toContain('workGroup')
  })

  it('includes a company column when showCompany is true', () => {
    expect(col('company')).toBeDefined()
  })

  it('omits the company column when showCompany is false', () => {
    const noCompany = directoryTableSpec({ showCompany: false })
    expect(noCompany.columns.find((c) => c.id === 'company')).toBeUndefined()
  })
})
