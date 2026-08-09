import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReviewModal from '@/app/dashboard/bookings/ReviewModal'

const defaultProps = {
  bookingId: 'booking123',
  sitterName: 'Jane Doe',
  onClose: jest.fn(),
  onSubmitted: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

describe('ReviewModal', () => {
  it('renders sitter name in the prompt', () => {
    render(<ReviewModal {...defaultProps} />)
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()
  })

  it('shows error when submitting without a rating', async () => {
    render(<ReviewModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Submit Review'))
    await waitFor(() => {
      expect(screen.getByText('Please select a rating')).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits with rating and comment', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: 'review1' }),
    })

    render(<ReviewModal {...defaultProps} />)

    // Click the 4th star
    const stars = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label')?.includes('star'))
    fireEvent.click(stars[3]) // rating = 4

    fireEvent.change(screen.getByPlaceholderText(/share details/i), {
      target: { value: 'Great sitter!' },
    })

    fireEvent.click(screen.getByText('Submit Review'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reviews', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ bookingId: 'booking123', rating: 4, comment: 'Great sitter!' }),
      }))
    })

    expect(defaultProps.onSubmitted).toHaveBeenCalledWith('booking123')
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('shows API error message on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Booking already reviewed' }),
    })

    render(<ReviewModal {...defaultProps} />)
    const stars = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label')?.includes('star'))
    fireEvent.click(stars[0]) // rating = 1
    fireEvent.click(screen.getByText('Submit Review'))

    await waitFor(() => {
      expect(screen.getByText('Booking already reviewed')).toBeInTheDocument()
    })
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Cancel is clicked', () => {
    render(<ReviewModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('enforces 500 character limit on comment', () => {
    render(<ReviewModal {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/share details/i)
    expect(textarea).toHaveAttribute('maxLength', '500')
  })

  it('shows character count', () => {
    render(<ReviewModal {...defaultProps} />)
    expect(screen.getByText('0/500')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText(/share details/i), {
      target: { value: 'Hello' },
    })
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })
})
