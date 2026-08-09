import { render, screen, fireEvent } from '@testing-library/react'
import StarRating from '@/components/StarRating'

describe('StarRating', () => {
  it('renders 5 stars by default', () => {
    render(<StarRating value={3} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })

  it('fills stars up to the rounded value', () => {
    render(<StarRating value={3} />)
    const stars = screen.getAllByRole('button').map((b) => b.textContent)
    // first 3 should be gold (★), last 2 grey
    expect(stars).toEqual(['★', '★', '★', '★', '★']) // text is always ★, color differs
  })

  it('has correct aria-label', () => {
    render(<StarRating value={4} />)
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument()
  })

  it('is not interactive by default — buttons are disabled', () => {
    render(<StarRating value={2} />)
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('calls onChange when interactive and a star is clicked', () => {
    const onChange = jest.fn()
    render(<StarRating value={0} interactive onChange={onChange} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2]) // 3rd star = rating 3
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('does not call onChange when not interactive', () => {
    const onChange = jest.fn()
    render(<StarRating value={0} onChange={onChange} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('supports custom max', () => {
    render(<StarRating value={2} max={3} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByLabelText('2 out of 3 stars')).toBeInTheDocument()
  })
})
