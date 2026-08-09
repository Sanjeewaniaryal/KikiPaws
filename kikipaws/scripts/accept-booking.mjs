import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not found'); process.exit(1) }

const BookingSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  sitterId: mongoose.Schema.Types.ObjectId,
  status: String,
  paymentStatus: String,
  service: String,
  startDate: Date,
  endDate: Date,
  totalPrice: Number,
}, { timestamps: true })

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema)

await mongoose.connect(MONGODB_URI)

const pending = await Booking.find({ status: 'pending' }).sort({ createdAt: -1 })

if (pending.length === 0) {
  console.log('No pending bookings found.')
  await mongoose.disconnect()
  process.exit(0)
}

console.log(`Found ${pending.length} pending booking(s):\n`)
pending.forEach((b, i) => {
  const start = new Date(b.startDate)
  const end = new Date(b.endDate)
  const timeOpts = { hour: 'numeric', minute: '2-digit' }
  const range = start.toDateString() === end.toDateString()
    ? `${start.toLocaleDateString()} ${start.toLocaleTimeString([], timeOpts)} – ${end.toLocaleTimeString([], timeOpts)}`
    : `${start.toLocaleDateString()} ${start.toLocaleTimeString([], timeOpts)} → ${end.toLocaleDateString()} ${end.toLocaleTimeString([], timeOpts)}`
  console.log(`  [${i}] ${b.service} | $${b.totalPrice} | ${range} | id: ${b._id}`)
})

// Accept the most recent one
const latest = pending[0]
await Booking.findByIdAndUpdate(latest._id, { status: 'accepted' })
console.log(`\n✅ Accepted booking: ${latest._id}`)
console.log('👉 Go to My Bookings → As Owner — you should now see a 💳 Pay Now button.')

await mongoose.disconnect()
