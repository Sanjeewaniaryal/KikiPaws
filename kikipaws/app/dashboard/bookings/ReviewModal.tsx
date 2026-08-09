'use client'

import { useState } from 'react'
import StarRating from '@/components/StarRating'

interface ReviewModalProps {
  bookingId: string
  sitterName: string
  onClose: () => void
  onSubmitted: (bookingId: string) => void
}

export default function ReviewModal({ bookingId, sitterName, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (rating === 0) { setError('Please select a rating'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit review')
        setSaving(false)
        return
      }
      onSubmitted(bookingId)
      onClose()
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ background: '#ffffff' }}
      >
        <h2 className="mb-1 text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Leave a review
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
          How was your experience with {sitterName}?
        </p>

        <div className="mb-6 flex justify-center">
          <StarRating value={rating} interactive onChange={setRating} size="lg" />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about your experience (optional)"
          maxLength={500}
          rows={4}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: '1px solid var(--border)',
            background: '#fafafa',
            color: 'var(--foreground)',
          }}
        />
        <p className="mt-1 text-right text-xs" style={{ color: 'var(--muted)' }}>
          {comment.length}/500
        </p>

        {error && (
          <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
