import { describe, expect, it } from 'vitest'
import { companiesTableSpec } from './companies-table-spec'

describe('companiesTableSpec', () => {
  const spec = companiesTableSpec({ onAdd: () => {} })

  const col = (id: string) => spec.columns.find((c) => c.id === id)

  it('marks employeeCount as a "more"-filtered number column', () => {
    expect(col('employeeCount')?.type).toBe('number')
    expect(col('employeeCount')?.filter).toBe('more')
  })

  it('marks jurisdiction as a quick filter', () => {
    expect(col('jurisdiction')?.filter).toBe('quick')
  })

  it('marks legalName as required', () => {
    expect(col('legalName')?.required).toBe(true)
  })

  it('includes subscriptionTier and usage as detail-tier columns', () => {
    const detailIds = spec.columns.filter((c) => c.detail === true).map((c) => c.id)
    expect(detailIds).toContain('subscriptionTier')
    expect(detailIds).toContain('usage')
  })

  it('labels the add action "New Company"', () => {
    expect(spec.add?.label).toBe('New Company')
  })

  it('omits the add action when canCreate is false', () => {
    const noAdd = companiesTableSpec({ onAdd: () => {}, canCreate: false })
    expect(noAdd.add).toBeUndefined()
  })

  it('searches legalName, tradeName, and code', () => {
    expect(spec.search).toBeDefined()
    const companyLike = {
      legalName: 'Meridian Technologies Private Limited',
      tradeName: 'Meridian Tech',
      code: 'COMP-2023-0001',
    } as Parameters<NonNullable<typeof spec.search>>[0]
    const text = spec.search!(companyLike)
    expect(text).toContain('Meridian Technologies Private Limited')
    expect(text).toContain('Meridian Tech')
    expect(text).toContain('COMP-2023-0001')
  })
})
