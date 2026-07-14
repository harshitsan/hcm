import { describe, expect, it } from 'vitest'
import { assetInventorySpec } from './asset-inventory-spec'

describe('assetInventorySpec', () => {
  const spec = assetInventorySpec({ today: '2026-07-13', showCompany: true })

  const col = (id: string) => spec.columns.find((c) => c.id === id)

  it('has the stable id "asset-inventory"', () => {
    expect(spec.id).toBe('asset-inventory')
  })

  it('sorts by assetTag ascending by default', () => {
    expect(spec.defaultSort).toEqual({ id: 'assetTag', dir: 'asc' })
  })

  it('marks assetTag as required', () => {
    expect(col('assetTag')?.required).toBe(true)
  })

  it('sets no filter on any column — filtering is external', () => {
    for (const c of spec.columns) {
      expect(c.filter).toBeUndefined()
    }
  })

  it('has a state column with a composite cell', () => {
    const state = col('state')
    expect(state).toBeDefined()
    expect(state?.type).toBe('badge')
    expect(state?.cell).toBeTypeOf('function')
  })

  it('includes a company column when showCompany is true', () => {
    expect(col('company')).toBeDefined()
  })

  it('omits the company column when showCompany is false', () => {
    const noCompanySpec = assetInventorySpec({ today: '2026-07-13', showCompany: false })
    expect(noCompanySpec.columns.find((c) => c.id === 'company')).toBeUndefined()
  })

  it('includes vendor as a detail-tier column only', () => {
    const detailIds = spec.columns.filter((c) => c.detail === true).map((c) => c.id)
    expect(detailIds).toContain('vendor')
    const gridIds = spec.columns.filter((c) => c.detail !== true).map((c) => c.id)
    expect(gridIds).not.toContain('vendor')
  })

  it('does not define add or views', () => {
    expect(spec.add).toBeUndefined()
    expect(spec.views).toBeUndefined()
  })
})
