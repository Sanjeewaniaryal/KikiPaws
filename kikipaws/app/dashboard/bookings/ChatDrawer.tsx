'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  _id: string
  text: string
  createdAt: string
  senderId: { _id: string; firstName: string; lastName: string; photo: string }
}

export default function ChatDrawer({
  bookingId,
  otherName,
  onClose,
}: {
  bookingId: string
  otherName: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set<string>())

  // Load initial messages
  useEffect(() => {
    fetch(`/api/messages/${bookingId}`)
      .then((r) => r.json())
      .then(({ messages: initial, currentUserId: uid }) => {
        setCurrentUserId(uid)
        if (Array.isArray(initial)) {
          initial.forEach((m: Message) => seenIds.current.add(m._id))
          setMessages(initial)
        }
      })
  }, [bookingId])

  // SSE for real-time new messages
  useEffect(() => {
    const es = new EventSource(`/api/messages/sse?bookingId=${bookingId}`)

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data)
      if (payload.type === 'connected') setConnected(true)
      if (payload.type === 'messages' && Array.isArray(payload.data)) {
        const fresh = (payload.data as Message[]).filter((m) => !seenIds.current.has(m._id))
        if (fresh.length > 0) {
          fresh.forEach((m) => seenIds.current.add(m._id))
          setMessages((prev) => [...prev, ...fresh])
        }
      }
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    const res = await fetch(`/api/messages/${bookingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const msg = await res.json()
    if (msg._id && !seenIds.current.has(msg._id)) {
      seenIds.current.add(msg._id)
      setMessages((prev) => [...prev, msg])
    }
    setText('')
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center">
      <div
        className="flex w-full max-w-md flex-col rounded-3xl shadow-xl"
        style={{ background: '#ffffff', height: '520px' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-3xl px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
              Chat with {otherName}
            </p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: connected ? '#16a34a' : '#d1d5db' }}
              />
              {connected ? 'Live' : 'Connecting…'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-sm transition-colors hover:bg-gray-100"
            style={{ color: 'var(--muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs py-8" style={{ color: 'var(--muted)' }}>
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId._id === currentUserId
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: isMe ? 'var(--primary)' : '#f3f4f6',
                    color: isMe ? '#ffffff' : 'var(--foreground)',
                    borderBottomRightRadius: isMe ? '4px' : '16px',
                    borderBottomLeftRadius: isMe ? '16px' : '4px',
                  }}
                >
                  <p>{msg.text}</p>
                  <p className="mt-1 text-right text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={send}
          className="flex items-center gap-2 rounded-b-3xl px-4 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
