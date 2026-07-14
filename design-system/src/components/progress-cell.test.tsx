import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressCell } from '@/components/progress-cell'

describe('ProgressCell', () => {
  it('renders the percent value', () => {
    render(<ProgressCell value={42} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })
})
