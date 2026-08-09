import mongoose, { Schema, Document } from 'mongoose'

export interface IBooking extends Document {
  ownerId: mongoose.Types.ObjectId
  sitterId: mongoose.Types.ObjectId
  sitterProfileId: mongoose.Types.ObjectId
  petId: mongoose.Types.ObjectId
  service: 'sitting' | 'walking' | 'boarding' | 'dropin' | 'grooming'
  startDate: Date
  endDate: Date
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed' | 'cancelled'
  totalPrice: number
  notes?: string
  reviewed: boolean
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  stripeSessionId?: string
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sitterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sitterProfileId: { type: Schema.Types.ObjectId, ref: 'SitterProfile', required: true },
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true },
    service: {
      type: String,
      enum: ['sitting', 'walking', 'boarding', 'dropin', 'grooming'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalPrice: { type: Number, required: true },
    notes: { type: String },
    reviewed: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
)

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)

export default Booking
