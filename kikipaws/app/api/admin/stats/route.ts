import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Booking from '@/lib/models/Booking'
import SitterProfile from '@/lib/models/SitterProfile'
import Review from '@/lib/models/Review'

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean)

export async function GET() {
  const { userId } = await auth()
  if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const [totalUsers, totalSitters, totalBookings, totalRevenue, recentBookings, recentUsers] = await Promise.all([
    User.countDocuments(),
    SitterProfile.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Booking.find().sort({ createdAt: -1 }).limit(10)
      .populate('ownerId', 'firstName lastName email')
      .populate('sitterId', 'firstName lastName')
      .populate('petId', 'name')
      .lean(),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
  ])

  const reviewCount = await Review.countDocuments()

  return NextResponse.json({
    stats: {
      totalUsers,
      totalSitters,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      reviewCount,
    },
    recentBookings,
    recentUsers,
  })
}
