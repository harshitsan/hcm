import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TableSpec } from './spec'
import { TableToolbar } from './toolbar'

interface Co { name: string; employees: number; region: string }

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India' },
  { name: 'Globex', employees: 20, region: 'US' },
]

const base: TableSpec<Co> = {
  id: 'toolbar-test',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
  ],
}

const noop = () => {}

describe('TableToolbar', () => {
  it('renders quick filters inline and keeps "more" filters out of the bar', () => {
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.getByRole('button', { name: /region/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^employees$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /more filters/i })).toBeInTheDocument()
  })

  it('shows the active filter count on the More filters trigger', () => {
    render(
      <TableToolbar spec={base} data={rows}
        filters={{ employees: { kind: 'range', min: 100, max: null } }}
        onFiltersChange={noop} visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.getByRole('button', { name: /more filters/i })).toHaveTextContent('1')
  })

  it('does not render a view switcher unless the spec opts in', () => {
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.queryByRole('button', { name: /card view/i })).not.toBeInTheDocument()
  })

  it('renders the view switcher when the spec declares views', () => {
    render(
      <TableToolbar spec={{ ...base, views: ['card'] }} data={rows} filters={{}}
        onFiltersChange={noop} visibility={{}} onVisibilityChange={noop}
        view='table' onViewChange={noop} />
    )
    expect(screen.getByRole('button', { name: /card view/i })).toBeInTheDocument()
  })

  it('fires the Add action instead of editing inline', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(
      <TableToolbar spec={{ ...base, add: { label: 'Add Company', onAdd } }}
        data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    await user.click(screen.getByRole('button', { name: /add company/i }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('drives the search box from spec.search/searchQuery/onSearchChange when spec.search is defined', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const searchSpec: TableSpec<Co> = { ...base, search: (r) => r.name }
    render(
      <TableToolbar spec={searchSpec} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop}
        searchQuery='acm' onSearchChange={onSearchChange} />
    )
    const boxes = screen.getAllByPlaceholderText(/search/i)
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toHaveValue('acm')
    await user.type(boxes[0], 'x')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('keeps the required-column search when spec.search is absent', () => {
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.getByPlaceholderText(/search name/i)).toBeInTheDocument()
  })

  it('disables required columns in the Columns menu', async () => {
    const user = userEvent.setup()
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{ name: true, employees: true, region: true }}
        onVisibilityChange={noop} />
    )
    await user.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.getByRole('menuitemcheckbox', { name: /name/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
