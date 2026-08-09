import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Message from '@/lib/models/Message'
import Booking from '@/lib/models/Booking'
import User from '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('bookingId')
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  await connectDB()

  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await Booking.findById(bookingId)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const isParticipant =
    booking.ownerId.toString() === user._id.toString() ||
    booking.sitterId.toString() === user._id.toString()
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let lastChecked = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      // Send a heartbeat immediately so the connection is established
      send({ type: 'connected' })

      const interval = setInterval(async () => {
        try {
          const newMessages = await Message.find({
            bookingId,
            createdAt: { $gt: lastChecked },
          })
            .populate('senderId', 'firstName lastName photo')
            .sort({ createdAt: 1 })
            .lean()

          if (newMessages.length > 0) {
            lastChecked = new Date()
            send({ type: 'messages', data: newMessages })
          } else {
            send({ type: 'heartbeat' })
          }
        } catch {
          clearInterval(interval)
        }
      }, 2000)

      // Clean up on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
