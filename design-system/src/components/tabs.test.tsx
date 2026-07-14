import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from '@/components/tabs'

describe('Tabs', () => {
  it('marks the active trigger with the underline classes', () => {
    render(
      <Tabs
        tabs={[
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
        ]}
        value='two'
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('One')).toHaveClass('border-transparent')
    expect(screen.getByText('Two')).toHaveClass('border-ink')
  })
})
