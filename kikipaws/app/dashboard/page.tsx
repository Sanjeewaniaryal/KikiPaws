import { UserButton } from '@clerk/nextjs'
import { syncUser } from '@/lib/actions/syncUser'
import { redirect } from 'next/navigation'
import UnreadBadge from '@/components/UnreadBadge'

export default async function DashboardPage() {
  const user = await syncUser()

  if (!user.onboarded) redirect('/onboarding')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-6 py-4 md:px-12"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(250,245,255,0.95)',
        }}
      >
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            Kiki Paws
          </span>
        </a>
        <UserButton />
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Welcome back, {user.firstName}!
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Here&apos;s your Kiki Paws overview.
          </p>
        </div>

        {/* Profile card */}
        <div
          className="rounded-3xl p-8 shadow-sm"
          style={{ background: '#ffffff', border: '1px solid var(--border)' }}
        >
          <h2 className="mb-6 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Your Profile
          </h2>

          <div className="flex items-center gap-6">
            {user.photo ? (
              <img
                src={user.photo}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
                style={{ background: '#f5f3ff' }}
              >
                🐾
              </div>
            )}
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {user.email}
              </p>
              <span
                className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium capitalize"
                style={{ background: '#f5f3ff', color: 'var(--primary)' }}
              >
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <a
              href="/dashboard/profile"
              className="inline-block rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              Edit Profile
            </a>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Phone
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
                {user.phone || 'Not set'}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Location
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
                {user.location || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className={`mt-6 grid grid-cols-1 gap-4 ${user.role === 'sitter' || user.role === 'both' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          <a
            href="/dashboard/pets"
            className="flex items-center gap-4 rounded-2xl p-5 transition-opacity hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl">🐶</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>My Pets</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Add and manage your pets</p>
            </div>
          </a>
          <a
            href="/sitters"
            className="flex items-center gap-4 rounded-2xl p-5 transition-opacity hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl">🔍</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Find a Sitter</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Browse trusted pet sitters</p>
            </div>
          </a>
          <a
            href="/dashboard/bookings"
            className="flex items-center gap-4 rounded-2xl p-5 transition-opacity hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl">📅</span>
            <div>
              <div className="flex items-center">
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>My Bookings</p>
                <UnreadBadge />
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>View and manage bookings</p>
            </div>
          </a>
          {(user.role === 'sitter' || user.role === 'both') && (
            <a
              href="/dashboard/sitter-profile"
              className="flex items-center gap-4 rounded-2xl p-5 transition-opacity hover:opacity-80"
              style={{ background: '#ffffff', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">🐾</span>
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Sitter Profile</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Services & availability</p>
              </div>
            </a>
          )}
          {(user.role === 'sitter' || user.role === 'both') && (
            <a
              href="/dashboard/earnings"
              className="flex items-center gap-4 rounded-2xl p-5 transition-opacity hover:opacity-80"
              style={{ background: '#ffffff', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">💰</span>
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Earnings</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Revenue & history</p>
              </div>
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
