'use client'

import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  pending: '#854d0e', accepted: '#166534', declined: '#991b1b',
  active: '#1e40af', completed: '#374151', cancelled: '#6b7280',
}

interface Stats { totalUsers: number; totalSitters: number; totalBookings: number; totalRevenue: number; reviewCount: number }
interface Booking {
  _id: string; service: string; status: string; totalPrice: number; createdAt: string
  ownerId: { firstName: string; lastName: string; email: string }
  sitterId: { firstName: string; lastName: string }
  petId: { name: string }
}
interface User { _id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string; onboarded: boolean }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [tab, setTab] = useState<'overview' | 'bookings' | 'users'>('overview')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => { if (r.status === 403) { setForbidden(true); return null } return r.json() })
      .then((data) => {
        if (!data) return
        setStats(data.stats)
        setBookings(data.recentBookings)
        setUsers(data.recentUsers)
        setLoading(false)
      })
  }, [])

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <span className="text-5xl">🚫</span>
          <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Access Denied</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>You are not authorised to view this page.</p>
          <a href="/dashboard" className="mt-4 inline-block text-sm" style={{ color: 'var(--primary)' }}>← Dashboard</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading admin panel…</p>
    </div>
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav className="flex items-center justify-between px-6 py-4 md:px-12" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250,245,255,0.95)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
          </a>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: '#7c3aed' }}>Admin</span>
        </div>
        <a href="/dashboard" className="text-sm" style={{ color: 'var(--muted)' }}>← Dashboard</a>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-12">
        <h1 className="mb-8 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Admin Panel</h1>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Total Users', value: stats.totalUsers, emoji: '👥' },
              { label: 'Sitters', value: stats.totalSitters, emoji: '🏡' },
              { label: 'Bookings', value: stats.totalBookings, emoji: '📅' },
              { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, emoji: '💰' },
              { label: 'Reviews', value: stats.reviewCount, emoji: '⭐' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                <span className="text-2xl">{s.emoji}</span>
                <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(['overview', 'bookings', 'users'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all"
              style={{
                background: tab === t ? 'var(--primary)' : '#ffffff',
                color: tab === t ? '#fff' : 'var(--foreground)',
                border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Recent Bookings */}
        {(tab === 'overview' || tab === 'bookings') && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Recent Bookings</h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    {['Owner', 'Sitter', 'Pet', 'Service', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b._id} style={{ background: i % 2 === 0 ? '#ffffff' : '#fafafa', borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{b.ownerId?.firstName} {b.ownerId?.lastName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{b.sitterId?.firstName} {b.sitterId?.lastName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{b.petId?.name}</td>
                      <td className="px-4 py-3 capitalize" style={{ color: 'var(--muted)' }}>{b.service}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--foreground)' }}>${b.totalPrice}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                          style={{ background: `${STATUS_COLORS[b.status]}20`, color: STATUS_COLORS[b.status] }}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Users */}
        {(tab === 'overview' || tab === 'users') && (
          <div>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Recent Users</h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    {['Name', 'Email', 'Role', 'Onboarded', 'Joined'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{ background: i % 2 === 0 ? '#ffffff' : '#fafafa', borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" style={{ background: '#f5f3ff', color: 'var(--primary)' }}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: u.onboarded ? '#166534' : '#854d0e' }}>{u.onboarded ? '✓ Yes' : '✗ No'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
