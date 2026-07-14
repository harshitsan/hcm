import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusPill } from '@/components/badge'

describe('StatusPill', () => {
  it('applies the matching bg/fg classes for the given tone', () => {
    render(<StatusPill tone='success'>Active</StatusPill>)
    const pill = screen.getByText('Active')
    expect(pill).toHaveClass('bg-success-bg')
    expect(pill).toHaveClass('text-success-fg')
  })

  it('applies high tone classes', () => {
    render(<StatusPill tone='high'>High</StatusPill>)
    const pill = screen.getByText('High')
    expect(pill).toHaveClass('bg-high-bg')
    expect(pill).toHaveClass('text-high-fg')
  })
})
