import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Review from '@/lib/models/Review'
import Booking from '@/lib/models/Booking'
import SitterProfile from '@/lib/models/SitterProfile'
import User from '@/lib/models/User'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sitterProfileId = searchParams.get('sitterProfileId')
  if (!sitterProfileId) return NextResponse.json({ error: 'sitterProfileId required' }, { status: 400 })

  await connectDB()

  const reviews = await Review.find({ sitterProfileId })
    .populate('reviewerId', 'firstName lastName photo')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(reviews)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { bookingId, rating, comment } = body

  if (!bookingId || !rating) {
    return NextResponse.json({ error: 'bookingId and rating are required' }, { status: 400 })
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'Rating must be an integer 1–5' }, { status: 400 })
  }

  await connectDB()

  const reviewer = await User.findOne({ clerkId: userId })
  if (!reviewer) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await Booking.findById(bookingId)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })
  }
  if (String(booking.ownerId) !== String(reviewer._id)) {
    return NextResponse.json({ error: 'Only the owner can leave a review' }, { status: 403 })
  }
  if (booking.reviewed) {
    return NextResponse.json({ error: 'Booking already reviewed' }, { status: 409 })
  }

  const review = await Review.create({
    bookingId: booking._id,
    reviewerId: reviewer._id,
    sitterId: booking.sitterId,
    sitterProfileId: booking.sitterProfileId,
    rating,
    comment: comment?.trim() || undefined,
  })

  // Update booking reviewed flag
  await Booking.findByIdAndUpdate(bookingId, { reviewed: true })

  // Recalculate sitter's average rating
  const allReviews = await Review.find({ sitterProfileId: booking.sitterProfileId })
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

  await SitterProfile.findByIdAndUpdate(booking.sitterProfileId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: allReviews.length,
  })

  return NextResponse.json(review, { status: 201 })
}
