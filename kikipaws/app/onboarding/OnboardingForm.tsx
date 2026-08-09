'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SERVICES = [
  { key: 'sitting', label: '🏡 Pet Sitting' },
  { key: 'walking', label: '🦮 Dog Walking' },
  { key: 'boarding', label: '🛏️ Boarding' },
  { key: 'dropin', label: '🐱 Drop-In Visits' },
  { key: 'grooming', label: '✂️ Grooming' },
]

export default function OnboardingForm({ firstName }: { firstName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<'owner' | 'sitter' | 'both' | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    location: '',
    phone: '',
    bio: '',
    services: [] as string[],
    hourlyRate: '',
    experience: '',
  })

  function toggleService(key: string) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(key)
        ? f.services.filter((s) => s !== key)
        : [...f.services, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return

    const errs: Record<string, string> = {}
    if (!form.location.trim()) errs.location = 'Location is required'
    if (isSitter) {
      if (!form.bio.trim()) errs.bio = 'Bio is required for sitters'
      if (form.services.length === 0) errs.services = 'Select at least one service'
      if (!form.hourlyRate || Number(form.hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid hourly rate'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)

    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, ...form, hourlyRate: Number(form.hourlyRate) }),
    })

    router.push('/dashboard')
    router.refresh()
  }

  const isSitter = role === 'sitter' || role === 'both'

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="text-5xl">🐾</span>
        <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Welcome, {firstName}!
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          Let&apos;s set up your profile. It only takes a minute.
        </p>
      </div>

      {/* Step 1 — Role picker */}
      {step === 'role' && (
        <div className="space-y-4">
          <p className="mb-6 text-center text-sm font-medium" style={{ color: 'var(--muted)' }}>
            What brings you to Kiki Paws?
          </p>

          {[
            { value: 'owner', emoji: '🐶', title: 'I need a pet sitter', desc: 'Find trusted sitters for my pets' },
            { value: 'sitter', emoji: '🏡', title: 'I want to be a sitter', desc: 'Offer pet care services' },
            { value: 'both', emoji: '🐾', title: 'Both!', desc: 'I have pets and also want to sit' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRole(option.value as 'owner' | 'sitter' | 'both')}
              className="flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all"
              style={{
                background: role === option.value ? '#f5f3ff' : '#ffffff',
                border: `2px solid ${role === option.value ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              <span className="text-3xl">{option.emoji}</span>
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{option.title}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{option.desc}</p>
              </div>
              {role === option.value && (
                <span className="ml-auto text-lg" style={{ color: 'var(--primary)' }}>✓</span>
              )}
            </button>
          ))}

          <button
            onClick={() => role && setStep('details')}
            disabled={!role}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <button
            type="button"
            onClick={() => setStep('role')}
            className="mb-2 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            ← Back
          </button>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Location <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="City, State"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: errors.location ? '#dc2626' : 'var(--border)', background: 'var(--background)' }}
            />
            {errors.location && <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{errors.location}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Phone
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
            />
          </div>

          {/* Sitter-only fields */}
          {isSitter && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Bio <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <textarea
                  placeholder="Tell pet owners a bit about yourself..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
                  style={{ borderColor: errors.bio ? '#dc2626' : 'var(--border)', background: 'var(--background)' }}
                />
                {errors.bio && <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{errors.bio}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Services you offer <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                {errors.services && <p className="text-xs" style={{ color: '#dc2626' }}>{errors.services}</p>}
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleService(s.key)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: form.services.includes(s.key) ? 'var(--primary)' : 'var(--background)',
                        color: form.services.includes(s.key) ? '#fff' : 'var(--foreground)',
                        border: `1px solid ${form.services.includes(s.key) ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    min="0"
                    value={form.hourlyRate}
                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: errors.hourlyRate ? '#dc2626' : 'var(--border)', background: 'var(--background)' }}
                  />
                  {errors.hourlyRate && <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{errors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 years"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {saving ? 'Setting up your profile...' : 'Go to Dashboard →'}
          </button>
        </form>
      )}
    </div>
  )
}
