import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Booking from '@/lib/models/Booking'
import User from '@/lib/models/User'
import SitterProfile from '@/lib/models/SitterProfile'
import { sendBookingRequestEmail } from '@/lib/email'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Fetch as owner
  const asOwner = await Booking.find({ ownerId: user._id })
    .populate('sitterId', 'firstName lastName photo')
    .populate('petId', 'name breed')
    .sort({ createdAt: -1 })
    .lean()

  // Fetch as sitter
  const asSitter = await Booking.find({ sitterId: user._id })
    .populate('ownerId', 'firstName lastName photo')
    .populate('petId', 'name breed')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ asOwner, asSitter })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sitterProfileId, petId, service, startDate, endDate, notes } = body

  await connectDB()

  const owner = await User.findOne({ clerkId: userId })
  if (!owner) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const sitterProfile = await SitterProfile.findById(sitterProfileId)
  if (!sitterProfile) return NextResponse.json({ error: 'Sitter not found' }, { status: 404 })

  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const totalPrice = sitterProfile.hourlyRate * 8 * days

  const booking = await Booking.create({
    ownerId: owner._id,
    sitterId: sitterProfile.userId,
    sitterProfileId: sitterProfile._id,
    petId,
    service,
    startDate: start,
    endDate: end,
    totalPrice,
    notes,
  })

  // Notify sitter of new booking request
  const sitterUser = await User.findById(sitterProfile.userId)
  if (sitterUser) {
    sendBookingRequestEmail({
      ownerName: `${owner.firstName} ${owner.lastName}`,
      ownerEmail: owner.email,
      sitterName: `${sitterUser.firstName} ${sitterUser.lastName}`,
      sitterEmail: sitterUser.email,
      service,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalPrice,
    }).catch(console.error)
  }

  return NextResponse.json(booking, { status: 201 })
}
