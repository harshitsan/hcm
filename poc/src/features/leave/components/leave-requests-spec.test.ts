import { describe, expect, it } from 'vitest'
import { leaveRequestsSpec } from './leave-requests-spec'

describe('leaveRequestsSpec', () => {
  const spec = leaveRequestsSpec()

  const col = (id: string) => spec.columns.find((c) => c.id === id)

  it('has the stable id "leave-requests"', () => {
    expect(spec.id).toBe('leave-requests')
  })

  it('sorts by employeeName ascending by default', () => {
    expect(spec.defaultSort).toEqual({ id: 'employeeName', dir: 'asc' })
  })

  it('marks employeeName as required', () => {
    expect(col('employeeName')?.required).toBe(true)
  })

  it('sets no filter on any column — filtering is external', () => {
    for (const c of spec.columns) {
      expect(c.filter).toBeUndefined()
    }
  })

  it('includes pendingWith as a detail-tier column', () => {
    const detailIds = spec.columns.filter((c) => c.detail === true).map((c) => c.id)
    expect(detailIds).toContain('pendingWith')
  })

  it('does not define add or views', () => {
    expect(spec.add).toBeUndefined()
    expect(spec.views).toBeUndefined()
  })
})
