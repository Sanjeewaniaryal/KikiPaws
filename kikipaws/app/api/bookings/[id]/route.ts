import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Booking from '@/lib/models/Booking'
import User from '@/lib/models/User'
import { sendBookingStatusEmail } from '@/lib/email'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  await connectDB()

  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await Booking.findById(id)
    .populate('ownerId', 'firstName lastName email')
    .populate('sitterId', 'firstName lastName email')

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const isSitter = booking.sitterId._id.toString() === user._id.toString()
  const isOwner = booking.ownerId._id.toString() === user._id.toString()

  if (['accepted', 'declined', 'active', 'completed'].includes(status) && !isSitter) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (status === 'cancelled' && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (status === 'accepted') {
    const conflict = await Booking.exists({
      _id: { $ne: booking._id },
      sitterId: booking.sitterId._id,
      status: { $in: ['accepted', 'active'] },
      startDate: { $lt: booking.endDate },
      endDate: { $gt: booking.startDate },
    })
    if (conflict) {
      return NextResponse.json({ error: 'You already have another accepted booking that overlaps this time.' }, { status: 409 })
    }
  }

  booking.status = status
  await booking.save()

  // Send email notification for key status changes
  if (['accepted', 'declined', 'cancelled'].includes(status)) {
    const owner = booking.ownerId as { firstName: string; lastName: string; email: string }
    const sitter = booking.sitterId as { firstName: string; lastName: string; email: string }
    sendBookingStatusEmail({
      ownerName: `${owner.firstName} ${owner.lastName}`,
      ownerEmail: owner.email,
      sitterName: `${sitter.firstName} ${sitter.lastName}`,
      sitterEmail: sitter.email,
      service: booking.service,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: booking.totalPrice,
    }, status as 'accepted' | 'declined' | 'cancelled').catch(console.error)
  }

  return NextResponse.json(booking)
}
