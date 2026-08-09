import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Kiki Paws <noreply@kikipaws.com>'

interface BookingEmailData {
  ownerName: string
  ownerEmail: string
  sitterName: string
  sitterEmail: string
  service: string
  startDate: string
  endDate: string
  totalPrice: number
}

const SERVICE_LABELS: Record<string, string> = {
  sitting: 'Pet Sitting', walking: 'Dog Walking',
  boarding: 'Overnight Boarding', dropin: 'Cat Drop-In', grooming: 'Grooming',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtRange(startDate: string, endDate: string) {
  const sameDay = new Date(startDate).toDateString() === new Date(endDate).toDateString()
  return sameDay
    ? `${fmt(startDate)}, ${fmtTime(startDate)} – ${fmtTime(endDate)}`
    : `${fmt(startDate)}, ${fmtTime(startDate)} → ${fmt(endDate)}, ${fmtTime(endDate)}`
}

export async function sendBookingRequestEmail(data: BookingEmailData) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: data.sitterEmail,
    subject: `New booking request from ${data.ownerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#7c3aed">🐾 New Booking Request</h2>
        <p>Hi ${data.sitterName},</p>
        <p><strong>${data.ownerName}</strong> has requested a booking with you.</p>
        <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Service:</strong> ${SERVICE_LABELS[data.service] || data.service}</p>
          <p style="margin:4px 0"><strong>Date &amp; Time:</strong> ${fmtRange(data.startDate, data.endDate)}</p>
          <p style="margin:4px 0"><strong>Total:</strong> $${data.totalPrice}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/bookings"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600">
          View & Respond
        </a>
      </div>`,
  })
}

export async function sendBookingStatusEmail(data: BookingEmailData, status: 'accepted' | 'declined' | 'cancelled') {
  if (!resend) return

  const isAccepted = status === 'accepted'
  const isCancelled = status === 'cancelled'
  const recipient = isCancelled ? { email: data.sitterEmail, name: data.sitterName } : { email: data.ownerEmail, name: data.ownerName }
  const actor = isCancelled ? data.ownerName : data.sitterName

  const subjects: Record<string, string> = {
    accepted: `✅ Your booking with ${data.sitterName} was accepted!`,
    declined: `Your booking request was declined`,
    cancelled: `Booking cancelled by ${data.ownerName}`,
  }

  const messages: Record<string, string> = {
    accepted: `Great news! ${actor} has accepted your booking request. You can now proceed to payment.`,
    declined: `Unfortunately, ${actor} is unavailable for your requested dates.`,
    cancelled: `${actor} has cancelled their booking with you.`,
  }

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: subjects[status],
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#7c3aed">🐾 Booking Update</h2>
        <p>Hi ${recipient.name},</p>
        <p>${messages[status]}</p>
        <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Service:</strong> ${SERVICE_LABELS[data.service] || data.service}</p>
          <p style="margin:4px 0"><strong>Date &amp; Time:</strong> ${fmtRange(data.startDate, data.endDate)}</p>
          <p style="margin:4px 0"><strong>Total:</strong> $${data.totalPrice}</p>
        </div>
        ${isAccepted ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/bookings"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600">
          Pay Now
        </a>` : ''}
      </div>`,
  })
}

export async function sendPaymentConfirmedEmail(data: BookingEmailData) {
  if (!resend) return

  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: data.ownerEmail,
      subject: '✅ Payment confirmed — your booking is active!',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#7c3aed">🐾 Payment Confirmed</h2>
          <p>Hi ${data.ownerName}, your payment was successful and your booking is now active!</p>
          <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:4px 0"><strong>Sitter:</strong> ${data.sitterName}</p>
            <p style="margin:4px 0"><strong>Service:</strong> ${SERVICE_LABELS[data.service] || data.service}</p>
            <p style="margin:4px 0"><strong>Date &amp; Time:</strong> ${fmtRange(data.startDate, data.endDate)}</p>
            <p style="margin:4px 0"><strong>Total paid:</strong> $${data.totalPrice}</p>
          </div>
        </div>`,
    }),
    resend.emails.send({
      from: FROM,
      to: data.sitterEmail,
      subject: `💰 Payment received for booking with ${data.ownerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#7c3aed">🐾 Payment Received</h2>
          <p>Hi ${data.sitterName}, payment has been confirmed for your upcoming booking.</p>
          <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:4px 0"><strong>Owner:</strong> ${data.ownerName}</p>
            <p style="margin:4px 0"><strong>Service:</strong> ${SERVICE_LABELS[data.service] || data.service}</p>
            <p style="margin:4px 0"><strong>Date &amp; Time:</strong> ${fmtRange(data.startDate, data.endDate)}</p>
            <p style="margin:4px 0"><strong>Amount:</strong> $${data.totalPrice}</p>
          </div>
        </div>`,
    }),
  ])
}
