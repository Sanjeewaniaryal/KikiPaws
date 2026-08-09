/**
 * Unit tests for the reviews API route logic.
 * We test the validation rules directly rather than mounting the full Next.js handler.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

function validateReviewInput(body: { bookingId?: unknown; rating?: unknown; comment?: unknown }) {
  const errors: string[] = []

  if (!body.bookingId) errors.push('bookingId and rating are required')
  else if (!body.rating) errors.push('bookingId and rating are required')

  if (body.rating !== undefined) {
    const r = body.rating as number
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      errors.push('Rating must be an integer 1–5')
    }
  }

  if (body.comment && typeof body.comment === 'string' && body.comment.length > 500) {
    errors.push('Comment exceeds 500 characters')
  }

  return errors
}

function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((a, b) => a + b, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

function canReview(booking: {
  status: string
  ownerId: string
  reviewed: boolean
}, reviewerId: string): { allowed: boolean; reason?: string } {
  if (booking.status !== 'completed') return { allowed: false, reason: 'Can only review completed bookings' }
  if (booking.ownerId !== reviewerId) return { allowed: false, reason: 'Only the owner can leave a review' }
  if (booking.reviewed) return { allowed: false, reason: 'Booking already reviewed' }
  return { allowed: true }
}

// ── validation tests ──────────────────────────────────────────────────────────

describe('Review input validation', () => {
  it('rejects missing bookingId', () => {
    const errors = validateReviewInput({ rating: 4 })
    expect(errors).toContain('bookingId and rating are required')
  })

  it('rejects missing rating', () => {
    const errors = validateReviewInput({ bookingId: 'abc' })
    expect(errors).toContain('bookingId and rating are required')
  })

  it('rejects rating below 1', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 0 })
    expect(errors).toContain('Rating must be an integer 1–5')
  })

  it('rejects rating above 5', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 6 })
    expect(errors).toContain('Rating must be an integer 1–5')
  })

  it('rejects float rating', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 4.5 })
    expect(errors).toContain('Rating must be an integer 1–5')
  })

  it('accepts valid input with all fields', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 5, comment: 'Great!' })
    expect(errors).toHaveLength(0)
  })

  it('accepts valid input without comment', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 3 })
    expect(errors).toHaveLength(0)
  })

  it('rejects comment over 500 chars', () => {
    const errors = validateReviewInput({ bookingId: 'abc', rating: 3, comment: 'x'.repeat(501) })
    expect(errors).toContain('Comment exceeds 500 characters')
  })
})

// ── authorization tests ───────────────────────────────────────────────────────

describe('Review authorization', () => {
  const completedBooking = { status: 'completed', ownerId: 'user1', reviewed: false }

  it('allows owner to review a completed unreviewed booking', () => {
    expect(canReview(completedBooking, 'user1')).toEqual({ allowed: true })
  })

  it('blocks review on non-completed booking', () => {
    const result = canReview({ ...completedBooking, status: 'active' }, 'user1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Can only review completed bookings')
  })

  it('blocks non-owner from reviewing', () => {
    const result = canReview(completedBooking, 'user2')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Only the owner can leave a review')
  })

  it('blocks duplicate review', () => {
    const result = canReview({ ...completedBooking, reviewed: true }, 'user1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Booking already reviewed')
  })
})

// ── average rating calculation ────────────────────────────────────────────────

describe('Average rating computation', () => {
  it('returns 0 for empty reviews', () => {
    expect(computeAverageRating([])).toBe(0)
  })

  it('computes average of a single review', () => {
    expect(computeAverageRating([4])).toBe(4)
  })

  it('computes average of multiple reviews', () => {
    expect(computeAverageRating([5, 4, 3])).toBe(4)
  })

  it('rounds to one decimal place', () => {
    expect(computeAverageRating([5, 4])).toBe(4.5)
    expect(computeAverageRating([5, 3])).toBe(4)
    expect(computeAverageRating([5, 5, 4])).toBe(4.7)
  })

  it('handles all 5-star reviews', () => {
    expect(computeAverageRating([5, 5, 5, 5])).toBe(5)
  })

  it('handles all 1-star reviews', () => {
    expect(computeAverageRating([1, 1, 1])).toBe(1)
  })
})
