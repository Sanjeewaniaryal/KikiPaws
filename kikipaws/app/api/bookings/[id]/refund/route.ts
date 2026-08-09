import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Booking from '@/lib/models/Booking'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-30' as never })

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()

  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await Booking.findById(id)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Only the owner can request a refund
  if (booking.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Only the owner can request a refund' }, { status: 403 })
  }

  if (booking.paymentStatus !== 'paid') {
    return NextResponse.json({ error: 'Booking has not been paid' }, { status: 400 })
  }

  if (booking.status !== 'cancelled') {
    return NextResponse.json({ error: 'Can only refund cancelled bookings' }, { status: 400 })
  }

  if (!booking.stripeSessionId) {
    return NextResponse.json({ error: 'No payment session found' }, { status: 400 })
  }

  // Retrieve the PaymentIntent from the Checkout session
  const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)
  if (!session.payment_intent) {
    return NextResponse.json({ error: 'No payment intent found' }, { status: 400 })
  }

  await stripe.refunds.create({ payment_intent: session.payment_intent as string })

  await Booking.findByIdAndUpdate(id, { paymentStatus: 'refunded' })

  return NextResponse.json({ success: true })
}
