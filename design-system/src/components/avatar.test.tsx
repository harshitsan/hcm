import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AvatarStack } from '@/components/avatar'

describe('AvatarStack', () => {
  it('renders a +N overflow chip when there are more names than max', () => {
    render(
      <AvatarStack
        names={['Aarav Shah', 'Neha Kapoor', 'Rohan Mehta', 'Ishita Rao', 'Sara Ali']}
        max={4}
      />
    )

    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('renders no overflow chip when names fit within max', () => {
    render(<AvatarStack names={['Aarav Shah', 'Neha Kapoor']} max={4} />)

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })
})
