import { syncUser } from '@/lib/actions/syncUser'
import { UserButton } from '@clerk/nextjs'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const user = await syncUser()

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
        <a href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            Kiki Paws
          </span>
        </a>
        <UserButton />
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12 md:px-12">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Edit Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Update your personal details.
          </p>
        </div>

        <div
          className="rounded-3xl p-8 shadow-sm"
          style={{ background: '#ffffff', border: '1px solid var(--border)' }}
        >
          {/* Avatar */}
          <div className="mb-8 flex items-center gap-4">
            {user.photo ? (
              <img src={user.photo} alt="Profile" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-xl"
                style={{ background: '#f5f3ff' }}
              >
                🐾
              </div>
            )}
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <ProfileForm
            initialData={{
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone || '',
              location: user.location || '',
              role: user.role,
            }}
          />
        </div>
      </main>
    </div>
  )
}
