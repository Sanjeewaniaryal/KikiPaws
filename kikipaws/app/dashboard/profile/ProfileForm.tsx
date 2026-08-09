'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialData: {
    firstName: string
    lastName: string
    phone: string
    location: string
    role: 'owner' | 'sitter' | 'both'
  }
}

export default function ProfileForm({ initialData }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            First Name
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Last Name
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Location
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="City, State"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          I am a...
        </label>
        <div className="flex gap-3">
          {(['owner', 'sitter', 'both'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, role: r })}
              className="rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all"
              style={{
                background: form.role === r ? 'var(--primary)' : 'var(--background)',
                color: form.role === r ? '#fff' : 'var(--foreground)',
                border: `1px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {r === 'both' ? 'Owner & Sitter' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: 'var(--primary)' }}>
            ✓ Saved
          </span>
        )}
      </div>
    </form>
  )
}
