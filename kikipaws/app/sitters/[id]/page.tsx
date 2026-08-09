'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import StarRating from '@/components/StarRating'
import BookingModal from '../BookingModal'

const SERVICE_LABELS: Record<string, string> = {
  sitting: '🏡 Pet Sitting', walking: '🦮 Dog Walking',
  boarding: '🛏️ Boarding', dropin: '🐱 Drop-In', grooming: '✂️ Grooming',
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

interface DayAvail { available: boolean; from: string; to: string }

interface SitterProfile {
  _id: string
  bio: string
  services: string[]
  hourlyRate: number
  location: string
  experience: string
  averageRating: number
  reviewCount: number
  profilePhoto?: string
  availability?: Record<string, DayAvail>
  userId: { firstName: string; lastName: string; photo: string; location: string }
}

interface Review {
  _id: string
  rating: number
  comment?: string
  createdAt: string
  reviewerId: { firstName: string; lastName: string; photo: string }
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function SitterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<SitterProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    fetch(`/api/sitters/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile)
        setReviews(data.reviews || [])
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Sitter not found</p>
          <a href="/sitters" className="mt-2 inline-block text-sm" style={{ color: 'var(--primary)' }}>← Back to sitters</a>
        </div>
      </div>
    )
  }

  const availDays = DAY_ORDER.filter((d) => profile.availability?.[d]?.available)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav
        className="flex items-center justify-between px-6 py-4 md:px-12"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250,245,255,0.95)' }}
      >
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
        </a>
        <a href="/sitters" className="text-sm" style={{ color: 'var(--muted)' }}>← All Sitters</a>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 md:px-12">

        {/* Hero card */}
        <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {(profile.profilePhoto || profile.userId.photo) ? (
              <img src={profile.profilePhoto || profile.userId.photo} alt={profile.userId.firstName} className="h-24 w-24 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full text-4xl" style={{ background: '#f5f3ff' }}>🐾</div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                {profile.userId.firstName} {profile.userId.lastName}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                📍 {profile.location || profile.userId.location || 'Location not set'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StarRating value={profile.averageRating} size="md" />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {profile.averageRating > 0
                    ? `${profile.averageRating.toFixed(1)} · ${profile.reviewCount} review${profile.reviewCount !== 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </span>
              </div>
              {profile.experience && (
                <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{profile.experience} experience</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-shrink-0">
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {profile.hourlyRate > 0 ? `$${profile.hourlyRate}` : '—'}
                <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>/hr</span>
              </p>
              <button
                onClick={() => setBooking(true)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Book Now
              </button>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{profile.bio}</p>
          )}
        </div>

        {/* Services */}
        {profile.services.length > 0 && (
          <div className="mt-6 rounded-3xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
            <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--foreground)' }}>Services</h2>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <span key={s} className="rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: '#f5f3ff', color: 'var(--primary)' }}>
                  {SERVICE_LABELS[s] || s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {availDays.length > 0 && (
          <div className="mt-6 rounded-3xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
            <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--foreground)' }}>Weekly Availability</h2>
            <div className="space-y-2">
              {availDays.map((d) => {
                const day = profile.availability![d]
                return (
                  <div key={d} className="flex items-center justify-between rounded-xl px-4 py-2.5"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{DAY_LABELS[d]}</span>
                    <span className="text-sm" style={{ color: '#166534' }}>
                      {formatTime(day.from)} – {formatTime(day.to)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6 rounded-3xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Reviews {reviews.length > 0 && <span style={{ color: 'var(--muted)' }}>({reviews.length})</span>}
          </h2>

          {reviews.length === 0 ? (
            <div className="rounded-2xl py-10 text-center" style={{ background: '#f9fafb' }}>
              <span className="text-3xl">⭐</span>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>No reviews yet — be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="rounded-2xl p-4" style={{ background: '#f9fafb', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {r.reviewerId.photo ? (
                        <img src={r.reviewerId.photo} alt={r.reviewerId.firstName} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ background: '#f5f3ff' }}>🐾</div>
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {r.reviewerId.firstName} {r.reviewerId.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} size="sm" />
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {booking && <BookingModal sitter={profile} onClose={() => setBooking(false)} />}
    </div>
  )
}
