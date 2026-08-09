'use client'

import { useEffect, useState } from 'react'

const SERVICE_LABELS: Record<string, string> = {
  sitting: '🏡 Pet Sitting',
  walking: '🦮 Dog Walking',
  boarding: '🛏️ Boarding',
  dropin: '🐱 Drop-In',
  grooming: '✂️ Grooming',
}

interface Pet {
  _id: string
  name: string
  breed: string
}

interface Props {
  sitter: {
    _id: string
    services: string[]
    hourlyRate: number
    userId: { firstName: string; lastName: string }
  }
  onClose: () => void
}

export default function BookingModal({ sitter, onClose }: Props) {
  const [pets, setPets] = useState<Pet[]>([])
  const [bookedRanges, setBookedRanges] = useState<{ start: string; end: string }[]>([])
  const [form, setForm] = useState({
    petId: '',
    service: sitter.services[0] || '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/pets').then((r) => r.json()).then(setPets)
    fetch(`/api/sitters/${sitter._id}`).then((r) => r.json()).then((d) => setBookedRanges(d.bookedRanges || []))
  }, [sitter._id])

  const startDateTime = form.startDate && form.startTime ? new Date(`${form.startDate}T${form.startTime}`) : null
  const endDateTime = form.endDate && form.endTime ? new Date(`${form.endDate}T${form.endTime}`) : null
  const validRange = !!(startDateTime && endDateTime && !isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime()) && endDateTime > startDateTime)
  const hours = validRange ? (endDateTime!.getTime() - startDateTime!.getTime()) / (1000 * 60 * 60) : 0
  const estimate = sitter.hourlyRate * hours
  const timeFmt = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const dateFmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const hasConflict = validRange && bookedRanges.some((r) => {
    const busyStart = new Date(r.start)
    const busyEnd = new Date(r.end)
    return busyStart < endDateTime! && busyEnd > startDateTime!
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.petId) { setError('Please select a pet'); return }
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime) { setError('Please select a start and end date/time'); return }
    if (!validRange) { setError('End must be after start'); return }
    if (hasConflict) { setError('This sitter is already booked for part of that time. Please choose a different time.'); return }
    setSaving(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sitterProfileId: sitter._id,
        petId: form.petId,
        service: form.service,
        startDate: startDateTime!.toISOString(),
        endDate: endDateTime!.toISOString(),
        notes: form.notes,
      }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to create booking'); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl p-8 shadow-xl" style={{ background: '#ffffff' }}>
        {done ? (
          <div className="text-center">
            <span className="text-5xl">🐾</span>
            <h2 className="mt-4 text-xl font-bold" style={{ color: 'var(--foreground)' }}>Booking Requested!</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              {sitter.userId.firstName} will review your request shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                Book {sitter.userId.firstName}
              </h2>
              <button onClick={onClose} className="text-xl" style={{ color: 'var(--muted)' }}>✕</button>
            </div>

            {pets.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-4xl">🐶</span>
                <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                  You need to add a pet before booking.
                </p>
                <a
                  href="/dashboard/pets"
                  className="mt-4 inline-block rounded-xl px-5 py-2 text-sm font-semibold text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  Add a Pet
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Which pet?
                  </label>
                  <select
                    value={form.petId}
                    onChange={(e) => setForm({ ...form, petId: e.target.value })}
                    required
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  >
                    <option value="">Select a pet</option>
                    {pets.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.breed})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Service
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    required
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  >
                    {sitter.services.map((s) => (
                      <option key={s} value={s}>{SERVICE_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      min={form.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Anything the sitter should know..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  />
                </div>

                {validRange && startDateTime && endDateTime && (
                  <div
                    className="rounded-xl p-4 text-sm"
                    style={hasConflict ? { background: '#fee2e2', color: '#991b1b' } : { background: '#f5f3ff', color: 'var(--foreground)' }}
                  >
                    <p style={hasConflict ? undefined : { color: 'var(--muted)' }}>
                      {startDateTime.toDateString() === endDateTime.toDateString()
                        ? <>{dateFmt(startDateTime)} · {timeFmt(startDateTime)} – {timeFmt(endDateTime)}</>
                        : <>{dateFmt(startDateTime)}, {timeFmt(startDateTime)} → {dateFmt(endDateTime)}, {timeFmt(endDateTime)}</>
                      }
                      {' '}({hours % 1 === 0 ? hours : hours.toFixed(1)} hour{hours !== 1 ? 's' : ''})
                    </p>
                    {hasConflict ? (
                      <p className="mt-1 font-medium">⚠️ Sitter is already booked during part of this time.</p>
                    ) : (
                      <p className="mt-1">
                        <span style={{ color: 'var(--muted)' }}>Estimated total: </span>
                        <span className="font-bold">${estimate.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                )}

                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                    style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || hasConflict}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'var(--primary)' }}
                  >
                    {saving ? 'Sending...' : 'Request Booking'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
