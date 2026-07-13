import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TableSpec } from './spec'
import { SpecTable } from './spec-table'

interface Co { name: string; employees: number; region: string; tier: string }

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India', tier: 'Basic' },
  { name: 'Globex', employees: 20, region: 'US', tier: 'Enterprise' },
]

const spec: TableSpec<Co> = {
  id: 'spec-table-test',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
    { id: 'tier', header: 'Tier', type: 'enum', accessor: (r) => r.tier, detail: true },
  ],
}

// SpecTable is fully controlled — an empty visibility map means "all visible".
const shown = {}
const noop = () => {}

describe('SpecTable', () => {
  beforeEach(() => localStorage.clear())

  it('renders grid columns but not detail columns', () => {
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.queryByText('Tier')).not.toBeInTheDocument()
  })

  it('ACTUALLY filters rows out (the bug this fixes)', () => {
    render(
      <SpecTable
        spec={spec}
        data={rows}
        filters={{ employees: { kind: 'range', min: 100, max: null } }}
        visibility={shown}
        onVisibilityChange={noop}
      />
    )
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.queryByText('Globex')).not.toBeInTheDocument()
  })

  it('hides a column when visibility says so', () => {
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={{ region: false }} onVisibilityChange={noop} />
    )
    expect(screen.queryByText('Region')).not.toBeInTheDocument()
  })

  it('reveals detail fields when a row is expanded', async () => {
    const user = userEvent.setup()
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} />
    )
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /expand row/i })[1])
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('renders no checkbox column when onSelectionChange is absent', () => {
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} />
    )
    expect(screen.queryByRole('checkbox', { name: /select all rows/i })).not.toBeInTheDocument()
  })

  it('reports the selected row through onSelectionChange', async () => {
    const user = userEvent.setup()
    const onSel = vi.fn()
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} onSelectionChange={onSel} />
    )
    await user.click(screen.getByRole('checkbox', { name: /select row 1/i }))
    expect(onSel).toHaveBeenLastCalledWith([rows[0]])
  })

  it('select-all reports every row', async () => {
    const user = userEvent.setup()
    const onSel = vi.fn()
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} onSelectionChange={onSel} />
    )
    await user.click(screen.getByRole('checkbox', { name: /select all rows/i }))
    expect(onSel).toHaveBeenLastCalledWith(rows)
  })

  it('clears selection when resetSelectionKey changes', async () => {
    const user = userEvent.setup()
    const onSel = vi.fn()
    const { rerender } = render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} onSelectionChange={onSel} resetSelectionKey={0} />
    )
    await user.click(screen.getByRole('checkbox', { name: /select row 1/i }))
    expect(onSel).toHaveBeenLastCalledWith([rows[0]])
    rerender(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} onSelectionChange={onSel} resetSelectionKey={1} />
    )
    expect(onSel).toHaveBeenLastCalledWith([])
  })
})
