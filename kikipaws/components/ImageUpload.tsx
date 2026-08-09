'use client'

import { useRef, useState } from 'react'
import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from '@/lib/uploadthing'

const { useUploadThing } = generateReactHelpers<OurFileRouter>()

interface Props {
  endpoint: 'petPhoto' | 'sitterPhoto'
  currentUrl?: string
  onUploadComplete: (url: string) => void
  label?: string
}

export default function ImageUpload({ endpoint, currentUrl, onUploadComplete, label = 'Photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setPreview(res[0].url)
        onUploadComplete(res[0].url)
      }
      setUploading(false)
    },
    onUploadError: (err) => {
      setError(err.message || 'Upload failed')
      setUploading(false)
    },
  })

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    await startUpload([file])
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex-shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80"
        style={{ width: 72, height: 72 }}
        disabled={uploading}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl" style={{ background: '#f5f3ff' }}>🐾</div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="text-xs text-white">…</span>
          </div>
        )}
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          {uploading ? 'Uploading…' : `Upload ${label}`}
        </button>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>JPG, PNG up to 4 MB</p>
        {error && <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
