import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from '@/components/data-table'

interface Row {
  id: string
  name: string
}

const rows: Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
]

describe('DataTable', () => {
  it('renders a row for each item', () => {
    render(
      <DataTable
        columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]}
        data={rows}
        getRowKey={(row) => row.id}
      />
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('fires onRowClick with the clicked row', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DataTable
        columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]}
        data={rows}
        getRowKey={(row) => row.id}
        onRowClick={onRowClick}
      />
    )

    await user.click(screen.getByText('Beta'))

    expect(onRowClick).toHaveBeenCalledWith(rows[1])
  })
})
