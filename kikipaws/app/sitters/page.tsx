'use client'

import { useEffect, useState, useCallback } from 'react'
import BookingModal from './BookingModal'
import StarRating from '@/components/StarRating'

const SERVICES = [
  { key: '', label: 'All' },
  { key: 'sitting', label: '🏡 Pet Sitting' },
  { key: 'walking', label: '🦮 Dog Walking' },
  { key: 'boarding', label: '🛏️ Boarding' },
  { key: 'dropin', label: '🐱 Drop-In' },
  { key: 'grooming', label: '✂️ Grooming' },
]

const SERVICE_LABELS: Record<string, string> = {
  sitting: '🏡 Pet Sitting', walking: '🦮 Dog Walking',
  boarding: '🛏️ Boarding', dropin: '🐱 Drop-In', grooming: '✂️ Grooming',
}

interface DayAvail { available: boolean; from: string; to: string }

interface Sitter {
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

const DAY_SHORT: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function SittersPage() {
  const [sitters, setSitters] = useState<Sitter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [bookingSitter, setBookingSitter] = useState<Sitter | null>(null)

  const fetchSitters = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeFilter) params.set('service', activeFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))

    const res = await fetch(`/api/sitters?${params}`)
    const data = await res.json()
    setSitters(Array.isArray(data.sitters) ? data.sitters : [])
    setPages(data.pages || 1)
    setTotal(data.total || 0)
    setLoading(false)
  }, [activeFilter, search, page])

  useEffect(() => { fetchSitters() }, [fetchSitters])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function handleFilter(key: string) {
    setActiveFilter(key)
    setPage(1)
  }

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
        <a href="/dashboard" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>Dashboard</a>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Find a Sitter</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {total > 0 ? `${total} sitter${total !== 1 ? 's' : ''} available` : 'Browse trusted pet sitters in your area.'}
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or location…"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Service filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              onClick={() => handleFilter(s.key)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                background: activeFilter === s.key ? 'var(--primary)' : '#ffffff',
                color: activeFilter === s.key ? '#fff' : 'var(--foreground)',
                border: `1px solid ${activeFilter === s.key ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sitter cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl p-6" style={{ background: '#f5f3ff', height: '220px' }} />
            ))}
          </div>
        ) : sitters.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#f5f3ff', border: '1px dashed var(--border)' }}>
            <span className="text-4xl">🐾</span>
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>No sitters found</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {sitters.map((sitter) => (
                <div
                  key={sitter._id}
                  className="rounded-3xl p-6 shadow-sm transition-shadow hover:shadow-md"
                  style={{ background: '#ffffff', border: '1px solid var(--border)', cursor: 'default' }}
                >
                  <div className="flex items-center gap-4">
                    {(sitter.profilePhoto || sitter.userId.photo) ? (
                      <img src={sitter.profilePhoto || sitter.userId.photo} alt={sitter.userId.firstName} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: '#f5f3ff' }}>🐾</div>
                    )}
                    <div>
                      <a href={`/sitters/${sitter._id}`} className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                        {sitter.userId.firstName} {sitter.userId.lastName}
                      </a>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <StarRating value={sitter.averageRating} size="sm" />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {sitter.averageRating > 0 ? `${sitter.averageRating.toFixed(1)} (${sitter.reviewCount})` : 'No reviews yet'}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        📍 {sitter.location || sitter.userId.location || 'Location not set'}
                      </p>
                      {sitter.experience && (
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{sitter.experience} experience</p>
                      )}
                    </div>
                  </div>

                  {sitter.bio && (
                    <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{sitter.bio}</p>
                  )}

                  {sitter.services.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {sitter.services.map((s) => (
                        <span key={s} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: '#f5f3ff', color: 'var(--primary)' }}>
                          {SERVICE_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  )}

                  {sitter.availability && DAY_ORDER.some((d) => sitter.availability?.[d]?.available) && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>Available</p>
                      <div className="flex flex-wrap gap-1">
                        {DAY_ORDER.filter((d) => sitter.availability?.[d]?.available).map((d) => (
                          <span key={d} className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: '#ecfdf5', color: '#166534' }}>
                            {DAY_SHORT[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {sitter.hourlyRate > 0 ? `$${sitter.hourlyRate}/hr` : 'Rate not set'}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/sitters/${sitter._id}`}
                        className="rounded-xl px-4 py-2 text-sm font-medium"
                        style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      >
                        View Profile
                      </a>
                      <button
                        onClick={() => setBookingSitter(sitter)}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ background: 'var(--primary)' }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  ← Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="h-9 w-9 rounded-xl text-sm font-medium"
                    style={{
                      background: p === page ? 'var(--primary)' : '#ffffff',
                      color: p === page ? '#fff' : 'var(--foreground)',
                      border: `1px solid ${p === page ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {bookingSitter && <BookingModal sitter={bookingSitter} onClose={() => setBookingSitter(null)} />}
    </div>
  )
}
