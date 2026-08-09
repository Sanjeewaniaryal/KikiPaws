'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'

interface EarningBooking {
  _id: string
  service: string
  totalPrice: number
  startDate: string
  endDate: string
  createdAt: string
  ownerId: { firstName: string; lastName: string }
  petId: { name: string }
}

interface EarningsData {
  total: number
  byMonth: Record<string, number>
  bookings: EarningBooking[]
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/sitter-profile/earnings')
      .then((r) => { if (r.status === 401 || r.status === 403) { setForbidden(true); return null } return r.json() })
      .then((d) => { if (d) { setData(d); setLoading(false) } })
  }, [])

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Not available</p>
          <a href="/dashboard" className="mt-2 inline-block text-sm" style={{ color: 'var(--primary)' }}>← Dashboard</a>
        </div>
      </div>
    )
  }

  const months = data ? Object.entries(data.byMonth) : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav
        className="flex items-center justify-between px-6 py-4 md:px-12"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250,245,255,0.95)' }}
      >
        <a href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
        </a>
        <UserButton />
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 md:px-12">
        <div className="mb-8">
          <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--muted)' }}>
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Earnings</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>All completed paid bookings.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl p-6" style={{ background: '#f5f3ff', height: 80 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Earned</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  ${data?.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Paid Bookings</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{data?.bookings.length}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Avg per Booking</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {data && data.bookings.length > 0
                    ? `$${(data.total / data.bookings.length).toFixed(2)}`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Monthly breakdown */}
            {months.length > 0 && (
              <div className="mb-8 rounded-3xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--foreground)' }}>Monthly Breakdown</h2>
                <div className="space-y-3">
                  {months.map(([month, amount]) => (
                    <div key={month} className="flex items-center justify-between rounded-xl px-4 py-2.5"
                      style={{ background: '#f9fafb', border: '1px solid var(--border)' }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{month}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking list */}
            <div className="rounded-3xl shadow-sm" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Transaction History</h2>
              </div>

              {data?.bookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <span className="text-3xl">💸</span>
                  <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>No paid bookings yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {data?.bookings.map((b) => (
                    <div key={b._id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                          {b.service} — {b.petId?.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {b.ownerId?.firstName} {b.ownerId?.lastName} ·{' '}
                          {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#166534' }}>+${b.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
