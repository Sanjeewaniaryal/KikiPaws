'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const ALL_SERVICES = ['sitting', 'walking', 'boarding', 'dropin', 'grooming'] as const

interface DayAvail { available: boolean; from: string; to: string }
type Availability = Record<string, DayAvail>

interface Props {
  initialProfile: {
    bio: string
    services: string[]
    hourlyRate: number
    experience: string
    availability?: Availability
    profilePhoto?: string
  } | null
}

const defaultAvailability = (): Availability =>
  Object.fromEntries(DAYS.map((d) => [d, { available: false, from: '09:00', to: '17:00' }]))

export default function SitterProfileForm({ initialProfile }: Props) {
  const router = useRouter()
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [services, setServices] = useState<string[]>(initialProfile?.services || [])
  const [hourlyRate, setHourlyRate] = useState(initialProfile?.hourlyRate || 0)
  const [experience, setExperience] = useState(initialProfile?.experience || '')
  const [profilePhoto, setProfilePhoto] = useState(initialProfile?.profilePhoto || '')
  const [availability, setAvailability] = useState<Availability>(
    initialProfile?.availability || defaultAvailability()
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function updateDay(day: string, field: keyof DayAvail, value: string | boolean) {
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (services.length === 0) { setError('Select at least one service.'); return }
    if (hourlyRate <= 0) { setError('Hourly rate must be greater than 0.'); return }

    setSaving(true)
    const res = await fetch('/api/sitter-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, services, hourlyRate, experience, availability, profilePhoto }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to save.')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Photo */}
      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Profile Photo</label>
        <ImageUpload
          endpoint="sitterPhoto"
          currentUrl={profilePhoto}
          onUploadComplete={(url) => setProfilePhoto(url)}
          label="Profile Photo"
        />
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Shown on your public sitter profile. Optional — your account photo is used by default.</p>
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Tell pet owners about yourself, your experience, and your love for animals…"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 resize-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        />
        <p className="mt-1 text-xs text-right" style={{ color: 'var(--muted)' }}>{bio.length}/500</p>
      </div>

      {/* Experience */}
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Experience</label>
        <input
          type="text"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="e.g. 3 years caring for dogs and cats"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        />
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Hourly Rate ($)</label>
        <input
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(Number(e.target.value))}
          min={1}
          step={0.01}
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        />
      </div>

      {/* Services */}
      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Services Offered</label>
        <div className="flex flex-wrap gap-2">
          {ALL_SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleService(s)}
              className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all"
              style={{
                background: services.includes(s) ? 'var(--primary)' : 'var(--background)',
                color: services.includes(s) ? '#fff' : 'var(--foreground)',
                border: `1px solid ${services.includes(s) ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {s === 'dropin' ? 'Drop-in' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="mb-3 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Weekly Availability</label>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const d = availability[day] || { available: false, from: '09:00', to: '17:00' }
            return (
              <div key={day} className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: d.available ? '#f5f3ff' : '#f9fafb', border: '1px solid var(--border)' }}>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => updateDay(day, 'available', !d.available)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors"
                  style={{ background: d.available ? 'var(--primary)' : '#d1d5db' }}
                  aria-label={`Toggle ${DAY_LABELS[day]}`}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5"
                    style={{ transform: d.available ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>

                <span className="w-24 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {DAY_LABELS[day]}
                </span>

                {d.available ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                    <input
                      type="time"
                      value={d.from}
                      onChange={(e) => updateDay(day, 'from', e.target.value)}
                      className="rounded-lg border px-2 py-1 text-sm outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={d.to}
                      onChange={(e) => updateDay(day, 'to', e.target.value)}
                      className="rounded-lg border px-2 py-1 text-sm outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Unavailable</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {saving ? 'Saving...' : 'Save Sitter Profile'}
        </button>
        {saved && <span className="text-sm" style={{ color: 'var(--primary)' }}>✓ Saved</span>}
      </div>
    </form>
  )
}
