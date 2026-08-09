import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Booking from '@/lib/models/Booking'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bookings = await Booking.find({
    sitterId: user._id,
    paymentStatus: 'paid',
  })
    .populate('ownerId', 'firstName lastName')
    .populate('petId', 'name')
    .sort({ createdAt: -1 })
    .lean()

  const total = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  // Group by month
  const byMonth: Record<string, number> = {}
  for (const b of bookings) {
    const key = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    byMonth[key] = (byMonth[key] || 0) + (b.totalPrice || 0)
  }

  return NextResponse.json({ total, byMonth, bookings })
}
