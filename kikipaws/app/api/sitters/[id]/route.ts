import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SitterProfile from '@/lib/models/SitterProfile'
import Review from '@/lib/models/Review'
import Booking from '@/lib/models/Booking'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const profile = await SitterProfile.findById(id)
    .populate('userId', 'firstName lastName photo location')
    .lean()

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const reviews = await Review.find({ sitterProfileId: id })
    .populate('reviewerId', 'firstName lastName photo')
    .sort({ createdAt: -1 })
    .lean()

  // Time ranges the sitter is already committed to, so the booking form can
  // warn about conflicts before the owner even submits a request.
  const sitterUserId = (profile.userId as { _id: unknown })._id
  const upcoming = await Booking.find({
    sitterId: sitterUserId,
    status: { $in: ['accepted', 'active'] },
    endDate: { $gte: new Date() },
  })
    .select('startDate endDate')
    .lean()
  const bookedRanges = upcoming.map((b) => ({ start: b.startDate, end: b.endDate }))

  return NextResponse.json({ profile, reviews, bookedRanges })
}
