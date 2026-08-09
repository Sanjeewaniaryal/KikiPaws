import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import Booking from '@/lib/models/Booking'
import { sendPaymentConfirmedEmail } from '@/lib/email'

// Stripe requires the raw body for signature verification — disable body parsing
export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.bookingId

    if (bookingId) {
      await connectDB()
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { paymentStatus: 'paid', status: 'active' },
        { new: true }
      )
        .populate('ownerId', 'firstName lastName email')
        .populate('sitterId', 'firstName lastName email')

      if (booking) {
        const owner = booking.ownerId as { firstName: string; lastName: string; email: string }
        const sitter = booking.sitterId as { firstName: string; lastName: string; email: string }
        sendPaymentConfirmedEmail({
          ownerName: `${owner.firstName} ${owner.lastName}`,
          ownerEmail: owner.email,
          sitterName: `${sitter.firstName} ${sitter.lastName}`,
          sitterEmail: sitter.email,
          service: booking.service,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
          totalPrice: booking.totalPrice,
        }).catch(console.error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
