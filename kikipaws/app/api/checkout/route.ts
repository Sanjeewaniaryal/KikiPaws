import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import stripe from '@/lib/stripe'
import Booking from '@/lib/models/Booking'
import User from '@/lib/models/User'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  await connectDB()

  const owner = await User.findOne({ clerkId: userId })
  if (!owner) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await Booking.findById(bookingId)
    .populate('sitterId', 'firstName lastName')
    .populate('petId', 'name')

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (String(booking.ownerId) !== String(owner._id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (booking.status !== 'accepted') {
    return NextResponse.json({ error: 'Booking must be accepted before payment' }, { status: 400 })
  }
  if (booking.paymentStatus === 'paid') {
    return NextResponse.json({ error: 'Booking already paid' }, { status: 409 })
  }

  const sitter = booking.sitterId as { firstName: string; lastName: string }
  const pet = booking.petId as { name: string }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Pet sitting for ${pet?.name ?? 'your pet'}`,
            description: `Sitter: ${sitter?.firstName ?? ''} ${sitter?.lastName ?? ''} · ${new Date(booking.startDate).toLocaleDateString()} – ${new Date(booking.endDate).toLocaleDateString()}`,
          },
          unit_amount: Math.round(booking.totalPrice * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: String(booking._id) },
    success_url: `${appUrl}/dashboard/bookings?payment=success`,
    cancel_url: `${appUrl}/dashboard/bookings?payment=cancelled`,
  })

  // Store session ID on booking so the webhook can look it up
  await Booking.findByIdAndUpdate(bookingId, { stripeSessionId: session.id })

  return NextResponse.json({ url: session.url })
}
