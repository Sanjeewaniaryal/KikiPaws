'use client'

import { useEffect, useState } from 'react'

export default function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/messages/unread')
        const data = await res.json()
        if (!cancelled) setCount(data.count || 0)
      } catch { /* silent */ }
    }

    poll()
    const id = setInterval(poll, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (count === 0) return null

  return (
    <span
      className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
      style={{ background: '#dc2626' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
