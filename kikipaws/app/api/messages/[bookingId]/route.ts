import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import Message from '@/lib/models/Message'
import Booking from '@/lib/models/Booking'
import User from '@/lib/models/User'
import '@/lib/models/User'

export async function GET(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await params
    await connectDB()

    const user = await User.findOne({ clerkId })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify user is part of this booking
    const booking = await Booking.findById(bookingId)
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (
      booking.ownerId.toString() !== user._id.toString() &&
      booking.sitterId.toString() !== user._id.toString()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await Message.find({ bookingId })
      .populate('senderId', 'firstName lastName photo')
      .sort({ createdAt: 1 })
      .lean()

    // Mark all messages from the other person as read
    await Message.updateMany(
      { bookingId, senderId: { $ne: user._id }, readBy: { $ne: user._id } },
      { $addToSet: { readBy: user._id } }
    )

    return NextResponse.json({ messages, currentUserId: user._id.toString() })
  } catch (err) {
    console.error('[GET /api/messages]', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await params
    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })

    await connectDB()

    const user = await User.findOne({ clerkId })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify user is part of this booking
    const booking = await Booking.findById(bookingId)
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (
      booking.ownerId.toString() !== user._id.toString() &&
      booking.sitterId.toString() !== user._id.toString()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const message = await Message.create({
      bookingId,
      senderId: user._id,
      text: text.trim(),
    })

    const populated = await message.populate('senderId', 'firstName lastName photo')

    return NextResponse.json(populated)
  } catch (err) {
    console.error('[POST /api/messages]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
